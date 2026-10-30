import "./style.css";
import { asset, verifiedBytes } from "./assets";
import {
  assess,
  enumerate,
  KINDS,
  type Kind,
  latin,
  occupied,
  REGIONS,
  regionLabel,
  statement,
  TERMS,
  type Term,
} from "./core/model";
import { blank, decode, encode, initial, type Notebook, parse } from "./core/record";
import { circles, diagram, htmlEscape, positions } from "./drawing";
import { notebookHtml, saveText } from "./export";
import { argumentFor, type LessonId, lesson, lessons } from "./lessons";
import { installOffline } from "./offline";
import { edition, reading, readings, textPolicy } from "./readings";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element: ${id}`);
  return found as T;
}
let notebook: Notebook = blank();
const history: Notebook[] = [];
let inspected = false;
let selectedReading = "two-worlds";
function remember(): void {
  history.push(structuredClone(notebook));
  if (history.length > 100) history.shift();
}
function fileStatus(text: string): void {
  el("file-status").textContent = text;
}
function errorText(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The operation did not finish. Your notebook is still here.";
}

el("lessons").innerHTML = lessons
  .map(
    (l) =>
      `<button type="button" data-lesson="${l.id}" aria-pressed="false"><strong>${htmlEscape(l.title)}</strong><small>${htmlEscape(l.subtitle)}</small></button>`,
  )
  .join("");
el("board").innerHTML =
  `<svg aria-hidden="true" viewBox="0 0 600 540">${circles()}</svg>${REGIONS.map((r) => {
    const [x, y] = positions[r] ?? [0, 0];
    return `<button type="button" class="token" id="region-${r}" data-region="${r}" style="left:${x / 6}%;top:${y / 5.4}%" aria-pressed="false">+</button>`;
  }).join("")}`;
el("reading").innerHTML = readings
  .map((r) => `<option value="${r.id}">${htmlEscape(r.title)} · ${htmlEscape(r.location)}</option>`)
  .join("");
el("edition-text").textContent = edition;
el("text-policy").textContent = textPolicy;

function render(): void {
  const s = notebook.current;
  const l = lesson(s.lesson);
  const argument = argumentFor(s.lesson, s.kind);
  const judgment = assess(argument, s.world, s.existence);
  for (const button of document.querySelectorAll<HTMLButtonElement>("button[data-lesson]"))
    button.setAttribute("aria-pressed", String(button.dataset.lesson === s.lesson));
  el("case-title").textContent = l.question;
  el("source-ref").textContent = `Prior Analytics ${l.source}`;
  el("instruction").textContent = l.instruction;
  el("premises").innerHTML = argument.premises
    .map((p, i) => {
      const j = judgment.premises[i];
      return `<div class="premise"><strong>${htmlEscape(statement(p))}</strong><span lang="la" class="small">${htmlEscape(latin(p))}</span><span class="truth ${j?.truth ? "true" : "false"}">${j?.truth ? "True" : "False"} in this world · ${htmlEscape(j?.explanation ?? "")}</span></div>`;
    })
    .join("");
  const conclusion = el<HTMLSelectElement>("conclusion");
  if (conclusion.dataset.optionsFor !== s.lesson) {
    conclusion.innerHTML = KINDS.map(
      (kind) => `<option value="${kind}">${statement({ ...argument.conclusion, kind })}</option>`,
    ).join("");
    conclusion.dataset.optionsFor = s.lesson;
  }
  conclusion.value = s.kind;
  el("conclusion-truth").textContent =
    `${judgment.conclusion.truth ? "True" : "False"} in this world. ${judgment.conclusion.explanation}`;
  el("conclusion-truth").className = judgment.conclusion.truth ? "true" : "false";
  for (const [i, t] of ["a", "b", "c"].entries())
    el<HTMLInputElement>(`exists-${t}`).checked = (s.existence & (1 << i)) !== 0;
  const descriptions = {
    empty: [
      "An empty draft",
      "Place at least one object. The model requires a nonempty universe, even if all three named classes are empty.",
    ],
    existence: [
      "A required inhabitant is missing",
      `Add an object in ${judgment.missing.map((t) => TERMS[t]).join(", ")}, or explicitly change the existence assumption. This world is not yet a counterexample under these settings.`,
    ],
    premise: [
      "A premise has broken",
      "A false conclusion is not enough: every premise must still hold. The tinted ring marks an object that violates a premise.",
    ],
    agreement: [
      "An agreeing world, not a proof",
      "The premises and proposed conclusion hold here. Try another world with the same premises, or inspect all permitted patterns.",
    ],
    counterexample: [
      "You have a counterexample",
      "Every premise and existence requirement holds. The proposed conclusion is false. This one world defeats the claim that it follows under these assumptions.",
    ],
  } as const;
  el("judgment").dataset.status = judgment.status;
  el("judgment-title").textContent = descriptions[judgment.status][0];
  el("judgment-body").textContent = descriptions[judgment.status][1];
  const violations = new Set(judgment.premises.flatMap((p) => (p.truth ? [] : p.relevant)));
  for (const r of REGIONS) {
    const button = el<HTMLButtonElement>(`region-${r}`);
    const present = (s.world & (1 << r)) !== 0;
    button.setAttribute("aria-pressed", String(present));
    button.setAttribute(
      "aria-label",
      `${present ? "Remove" : "Place"} object ${r + 1}: ${regionLabel(r)}`,
    );
    button.title = regionLabel(r);
    button.textContent = present ? String(r + 1) : "+";
    button.classList.toggle("violates", present && violations.has(r));
  }
  const count = occupied(s.world).length;
  el("object-count").textContent = `${count} object${count === 1 ? "" : "s"}`;
  el("inventory").innerHTML = count
    ? `<ul>${occupied(s.world)
        .map((r) => `<li>Object ${r + 1}: ${regionLabel(r)}.</li>`)
        .join("")}</ul>`
    : "<p>No objects placed. Add one in any region, including outside all three circles.</p>";
  el<HTMLButtonElement>("undo").disabled = !history.length;
  el("steps").innerHTML = l.steps.map((step) => `<li>${htmlEscape(step)}</li>`).join("");
  el("substitutions").hidden = s.lesson !== "two-worlds";
  el("search-results").hidden = !inspected;
  el("inspect").setAttribute("aria-expanded", String(inspected));
  el("inspect").textContent = inspected
    ? "Hide the complete search"
    : "Inspect every possible pattern";
  if (inspected) renderSearch();
  renderComparison();
  renderCitations();
  if (el<HTMLTextAreaElement>("note").value !== notebook.note)
    el<HTMLTextAreaElement>("note").value = notebook.note;
}
function renderSearch(): void {
  const s = notebook.current;
  const result = enumerate(argumentFor(s.lesson, s.kind), s.existence);
  el("search-verdict").textContent =
    result.verdict === "valid"
      ? "The conclusion follows in every permitted world of this model. There is no counterexample under these assumptions."
      : result.verdict === "invalid"
        ? "The conclusion does not follow. Choose a counterexample to inspect, or keep building your own."
        : "No world satisfies all the premises and existence requirements. This is not an ordinary valid deduction with satisfiable premises.";
  el("search-counts").innerHTML =
    `<tr><th scope="row">Premises or existence requirements fail</th><td>${255 - result.admissible.length}</td></tr><tr><th scope="row">Premises hold; conclusion true</th><td>${result.agreeing.length}</td></tr><tr><th scope="row">Premises hold; conclusion false</th><td>${result.counterexamples.length}</td></tr>`;
  const select = el<HTMLSelectElement>("witness-choice");
  const previous = select.value;
  select.innerHTML = [
    ["Counterexamples", result.counterexamples],
    ["Agreeing worlds", result.agreeing],
  ]
    .map(
      ([name, worlds]) =>
        `<optgroup label="${name}">${(worlds as number[])
          .map(
            (w) =>
              `<option value="${w}">Pattern ${w} · objects ${occupied(w)
                .map((r) => r + 1)
                .join(", ")}</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("");
  if ([...select.options].some((o) => o.value === previous)) select.value = previous;
  select.disabled = !result.admissible.length;
  el<HTMLButtonElement>("load-witness").disabled = !result.admissible.length;
}
function renderComparison(): void {
  const p = notebook.pinned;
  const s = notebook.current;
  el("restore").hidden = !p;
  if (!p) {
    el("comparison-content").innerHTML = "";
    el("comparison-note").textContent =
      "Pin a world to hold it still while you change the live one.";
    return;
  }
  const same = p.lesson === s.lesson && p.kind === s.kind && p.existence === s.existence;
  const pj = assess(argumentFor(p.lesson, p.kind), p.world, p.existence);
  const sj = assess(argumentFor(s.lesson, s.kind), s.world, s.existence);
  el("comparison-note").textContent = !same
    ? "Different questions or existence assumptions: this is not a paired counterexample under one set of assumptions."
    : pj.admissible && sj.admissible && pj.conclusion.truth !== sj.conclusion.truth
      ? "Same premises. Same existence assumptions. Both worlds are permitted, but the conclusion changes truth. It cannot follow from those premises."
      : "These snapshots use the same question and existence assumptions. Check that both worlds satisfy the premises before comparing their conclusions.";
  el("comparison-content").innerHTML =
    `<div class="world-pair"><figure>${diagram(p.world, "Pinned world")}<figcaption>Pinned · ${htmlEscape(lesson(p.lesson).title)}</figcaption></figure><figure>${diagram(s.world, "Current world")}<figcaption>Current · ${htmlEscape(lesson(s.lesson).title)}</figcaption></figure></div><table><caption>Each result uses its own saved assumptions</caption><thead><tr><th scope="col">Check</th><th scope="col">Pinned</th><th scope="col">Current</th></tr></thead><tbody><tr><th scope="row">Required inhabitants</th>${[p, s].map((r) => `<td>${TERMS.filter((_, t) => (r.existence & (1 << t)) !== 0).join(", ") || "None"}</td>`).join("")}</tr><tr><th scope="row">Premises</th>${[p, s].map((r) => `<td>${argumentFor(r.lesson, r.kind).premises.map(statement).join("; ")}</td>`).join("")}</tr><tr><th scope="row">Permitted world</th><td>${pj.admissible ? "Yes" : "No"}</td><td>${sj.admissible ? "Yes" : "No"}</td></tr><tr><th scope="row">Proposed conclusion</th>${[p, s].map((r) => `<td>${statement(argumentFor(r.lesson, r.kind).conclusion)}</td>`).join("")}</tr><tr><th scope="row">Conclusion truth</th><td>${pj.conclusion.truth ? "True" : "False"}</td><td>${sj.conclusion.truth ? "True" : "False"}</td></tr></tbody></table>`;
}
function renderCitations(): void {
  const entries = notebook.citations
    .map(
      (id) =>
        `<div class="citation"><span>${htmlEscape(reading(id).location)} · ${htmlEscape(reading(id).title)}</span><button type="button" data-remove-citation="${id}">Remove<span class="sr-only"> ${htmlEscape(reading(id).title)}</span></button></div>`,
    )
    .join("");
  el("citations").innerHTML = entries
    ? `<h3>Your source passages</h3>${entries}`
    : '<p class="small">Add a passage from the reader to connect your explanation to the source.</p>';
  el<HTMLButtonElement>("cite").disabled = notebook.citations.includes(selectedReading);
  el("cite").textContent = notebook.citations.includes(selectedReading)
    ? "This passage is in your notebook"
    : "Add this passage to my notebook";
}
function showReading(id: string): void {
  selectedReading = id;
  const r = reading(id);
  el<HTMLSelectElement>("reading").value = id;
  el("reading-ref").textContent = r.location;
  const sorted = [...r.words].sort((a, b) => b.phrase.length - a.phrase.length);
  let remaining = r.greek;
  let html = "";
  while (remaining) {
    const found = sorted
      .map((word) => ({ word, index: remaining.indexOf(word.phrase) }))
      .filter((m) => m.index >= 0)
      .sort((a, b) => a.index - b.index)[0];
    if (!found) {
      html += htmlEscape(remaining);
      break;
    }
    html +=
      htmlEscape(remaining.slice(0, found.index)) +
      `<button type="button" data-word="${r.words.indexOf(found.word)}" aria-pressed="false">${htmlEscape(found.word.phrase)}</button>`;
    remaining = remaining.slice(found.index + found.word.phrase.length);
  }
  el("greek").innerHTML = html;
  el("word-note").textContent = "Select an underlined Greek phrase to read it closely.";
  el("english").textContent = r.english;
  el("latin").textContent = r.latin;
  el("editorial").textContent = r.note;
  el<HTMLSelectElement>("scan-page").value = String(r.page);
  void showScan(r.page);
  renderCitations();
}
let scanRequest = 0;
let scanController: AbortController | undefined;
let scanUrl: string | undefined;
async function showScan(page: number): Promise<void> {
  const request = ++scanRequest;
  scanController?.abort();
  scanController = new AbortController();
  const img = el<HTMLImageElement>("scan");
  img.hidden = true;
  img.removeAttribute("src");
  if (scanUrl) {
    URL.revokeObjectURL(scanUrl);
    scanUrl = undefined;
  }
  el("scan-viewport").classList.remove("enlarged");
  el("scan-viewport").scrollTo(0, 0);
  el("zoom").setAttribute("aria-pressed", "false");
  el("zoom").textContent = "Enlarge page";
  el("scan-status").textContent = `Loading complete printed page ${page}…`;
  el<HTMLAnchorElement>("archive-page").href =
    `https://archive.org/details/Bekker1831/page/n${page + 7}/mode/1up`;
  let url: string | undefined;
  try {
    const bytes = await verifiedBytes(asset(`sources/bekker-p${page}.jpg`), scanController.signal);
    if (request !== scanRequest) return;
    url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    scanUrl = url;
    img.src = url;
    img.alt = `Complete printed page ${page} from Bekker's 1831 Aristotle edition, including textual notes.`;
    await img.decode();
    if (request !== scanRequest) return;
    img.style.setProperty("--source-width", `${img.naturalWidth}px`);
    img.hidden = false;
    el("scan-status").textContent =
      `Printed page ${page} · complete ${img.naturalWidth}-pixel image. Enlarge and use arrow keys to pan.`;
  } catch (error) {
    if (request !== scanRequest) return;
    img.hidden = true;
    if (url) URL.revokeObjectURL(url);
    el("scan-status").textContent = errorText(error);
  }
}

el("lessons").addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-lesson]");
  if (!button) return;
  remember();
  notebook.current = initial(button.dataset.lesson as LessonId);
  inspected = false;
  el("preset-note").textContent = "";
  render();
  showReading(lesson(notebook.current.lesson).reading);
});
el("board").addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-region]");
  if (!button) return;
  remember();
  notebook.current.world ^= 1 << Number(button.dataset.region);
  el("preset-note").textContent = "";
  render();
});
el("conclusion").addEventListener("change", () => {
  remember();
  notebook.current.kind = el<HTMLSelectElement>("conclusion").value as Kind;
  render();
});
for (const [i, t] of ["a", "b", "c"].entries())
  el(`exists-${t}`).addEventListener("change", () => {
    remember();
    notebook.current.existence ^= 1 << (i as Term);
    render();
  });
el("pin").addEventListener("click", () => {
  remember();
  notebook.pinned = { ...notebook.current };
  render();
  fileStatus("Pinned world saved. Change the live world to compare.");
});
el("restore").addEventListener("click", () => {
  if (!notebook.pinned) return;
  remember();
  notebook.current = { ...notebook.pinned };
  render();
  showReading(lesson(notebook.current.lesson).reading);
});
el("undo").addEventListener("click", () => {
  const previous = history.pop();
  if (!previous) return;
  notebook = previous;
  render();
  showReading(lesson(notebook.current.lesson).reading);
});
el("clear").addEventListener("click", () => {
  remember();
  notebook.current.world = 0;
  render();
});
el("reset").addEventListener("click", () => {
  remember();
  notebook.current = initial(notebook.current.lesson);
  render();
});
for (const [id, world] of [
  ["horse", 40],
  ["stone", 24],
] as const)
  el(id).addEventListener("click", () => {
    remember();
    notebook.current = {
      ...initial("two-worlds"),
      kind: notebook.current.kind,
      existence: notebook.current.existence,
      world,
    };
    render();
    el("preset-note").textContent =
      id === "horse"
        ? "Illustration: A = animals; B = humans; C = horses. Object 4 is a human animal; object 6 is a horse animal."
        : "Illustration: A = animals; B = humans; C = stones. Object 4 is a human animal; object 5 is a stone outside both other classes.";
  });
el("inspect").addEventListener("click", () => {
  inspected = !inspected;
  render();
});
el("load-witness").addEventListener("click", () => {
  const value = Number(el<HTMLSelectElement>("witness-choice").value);
  if (!Number.isInteger(value) || value < 1 || value > 255) return;
  remember();
  notebook.current.world = value;
  render();
  el("judgment").scrollIntoView({ block: "nearest" });
});
el("reading").addEventListener("change", () => showReading(el<HTMLSelectElement>("reading").value));
el("greek").addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-word]");
  if (!button) return;
  const word = reading(selectedReading).words[Number(button.dataset.word)];
  if (!word) return;
  for (const b of el("greek").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b.dataset.word === button.dataset.word));
  el("word-note").innerHTML =
    `<strong><span lang="grc">${htmlEscape(word.phrase)}</span> · <em lang="la">${htmlEscape(word.latin)}</em></strong>${htmlEscape(word.note)}`;
});
el("scan-page").addEventListener(
  "change",
  () => void showScan(Number(el<HTMLSelectElement>("scan-page").value)),
);
el("retry-scan").addEventListener(
  "click",
  () => void showScan(Number(el<HTMLSelectElement>("scan-page").value)),
);
el("zoom").addEventListener("click", () => {
  const zoomed = el("scan-viewport").classList.toggle("enlarged");
  el("zoom").setAttribute("aria-pressed", String(zoomed));
  el("zoom").textContent = zoomed ? "Fit page" : "Enlarge page";
  if (zoomed) el("scan-viewport").focus();
});
el("scan-viewport").addEventListener("keydown", (event) => {
  if (!el("scan-viewport").classList.contains("enlarged")) return;
  const direction: Record<string, [number, number]> = {
    ArrowLeft: [-72, 0],
    ArrowRight: [72, 0],
    ArrowUp: [0, -72],
    ArrowDown: [0, 72],
  };
  const delta = direction[event.key];
  if (!delta) return;
  event.preventDefault();
  el("scan-viewport").scrollBy({ left: delta[0], top: delta[1], behavior: "instant" });
});
el("cite").addEventListener("click", () => {
  if (notebook.citations.includes(selectedReading)) return;
  remember();
  notebook.citations.push(selectedReading);
  renderCitations();
  el<HTMLButtonElement>("undo").disabled = false;
  fileStatus(`Added ${reading(selectedReading).location} to your notebook.`);
});
el("citations").addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-remove-citation]");
  if (!button) return;
  remember();
  notebook.citations = notebook.citations.filter((id) => id !== button.dataset.removeCitation);
  render();
  el("cite").focus();
});
el("note").addEventListener("input", () => {
  notebook.note = el<HTMLTextAreaElement>("note").value;
});
el("save-json").addEventListener("click", () => {
  saveText(`${JSON.stringify(notebook, null, 2)}\n`, "application/json", "horos-notebook.json");
  fileStatus("Saved an editable notebook. Results will be recomputed when it reopens.");
});
el("save-svg").addEventListener("click", () => {
  saveText(diagram(notebook.current.world), "image/svg+xml", "horos-world.svg");
  fileStatus(
    "Saved the current membership diagram. Use the notebook for premises and assumptions.",
  );
});
let exportController: AbortController | undefined;
el("save-html").addEventListener("click", async () => {
  if (exportController) return;
  const snapshot = structuredClone(notebook);
  const controller = new AbortController();
  exportController = controller;
  el<HTMLButtonElement>("save-html").disabled = true;
  el("cancel-export").hidden = false;
  fileStatus(
    "Preparing the notebook from these saved facts. Checking every source page, font, and license…",
  );
  try {
    const html = await notebookHtml(snapshot, controller.signal);
    saveText(html, "text/html", "horos-notebook.html");
    fileStatus(
      "Saved an illustrated notebook with the facts and explanation captured when Save was pressed.",
    );
  } catch (error) {
    fileStatus(
      controller.signal.aborted
        ? "Notebook preparation canceled. Your work is still here."
        : errorText(error),
    );
  } finally {
    exportController = undefined;
    el<HTMLButtonElement>("save-html").disabled = false;
    el("cancel-export").hidden = true;
  }
});
el("cancel-export").addEventListener("click", () => exportController?.abort());
el("copy-link").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.hash = encode(notebook);
  const text = url.href;
  el<HTMLTextAreaElement>("share-text").value = text;
  try {
    await navigator.clipboard.writeText(text);
    el("share-fallback").hidden = true;
    fileStatus(
      "Notebook link copied, including your explanation. Editing the board does not change the address bar.",
    );
  } catch {
    el("share-fallback").hidden = false;
    el<HTMLTextAreaElement>("share-text").select();
    fileStatus("Select and copy this notebook link. Clipboard access was unavailable.");
  }
});
function reopen(text: string): void {
  const next = parse(text);
  remember();
  notebook = next;
  inspected = false;
  render();
  showReading(lesson(notebook.current.lesson).reading);
  fileStatus("Notebook reopened. All results were recomputed from its facts.");
}
el("open-file").addEventListener("change", async () => {
  const input = el<HTMLInputElement>("open-file");
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 64_000) throw new Error("This file is too large for a Horos notebook.");
    reopen(await file.text());
  } catch (error) {
    fileStatus(errorText(error));
  } finally {
    input.value = "";
  }
});
function readHash(): void {
  if (!location.hash.startsWith("#notebook=")) return;
  try {
    const next = decode(location.hash);
    remember();
    notebook = next;
    inspected = false;
    render();
    showReading(lesson(notebook.current.lesson).reading);
    fileStatus("Shared notebook opened. Results were recomputed.");
  } catch (error) {
    fileStatus(errorText(error));
  }
}
window.addEventListener("hashchange", readHash);
render();
showReading(selectedReading);
readHash();
installOffline(el("offline-status"));
