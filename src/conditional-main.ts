import "./conditional.css";
import { verifiedBytes } from "./assets";
import { conditionalAsset } from "./conditional-assets";
import { conditionalScene, conditionalSvg } from "./conditional-drawing";
import { conditionalHtml } from "./conditional-export";
import { conditionalEdition, conditionalPolicy, conditionalReadings } from "./conditional-readings";
import {
  blankConditional,
  CASES,
  type Case,
  type ConditionalNotebook,
  type ConditionalSnapshot,
  caseLabel,
  conditionalLink,
  inherentCases,
  initialConditional,
  judgeConditional,
  parseConditional,
  readConditionalLink,
  type Sentence,
  sentenceText,
  values,
} from "./core/conditional";
import { NotebookHistory } from "./core/history";
import { saveText } from "./download";
import { htmlEscape as esc } from "./drawing";
import { installOffline } from "./offline";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing conditional control: ${id}`);
  return node as T;
}
function message(value: string): void {
  el("file-status").textContent = value;
}
function errorText(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The operation did not finish. Your work is still here.";
}
let notebook = blankConditional();
const history = new NotebookHistory<ConditionalNotebook>();
let revision = 0;
let importRequest = 0;
let exporter: AbortController | null = null;
if (location.hash.startsWith("#conditional=")) {
  try {
    notebook = readConditionalLink(location.hash);
    message("The shared conditional notebook is open. Save a copy to keep it.");
  } catch (error) {
    message(errorText(error));
  }
}

el("case-rows").innerHTML = CASES.map(
  (c) =>
    `<tr id="case-row-${c}" data-case="${c}"><th scope="row" id="case-label-${c}"></th><td><label class="allow-label"><span class="sr-only" id="allow-label-${c}"></span><input type="checkbox" id="allow-${c}" data-allow="${c}" aria-labelledby="allow-label-${c}" /></label></td><td><button id="now-${c}" type="button" data-now="${c}" aria-pressed="false">Use now</button></td></tr>`,
).join("");

function change(label: string, apply: (next: ConditionalNotebook) => void, prose = false): void {
  const next = structuredClone(notebook);
  apply(next);
  if (JSON.stringify(next) === JSON.stringify(notebook)) return;
  history.remember(notebook, label, prose);
  notebook = next;
  revision++;
  el("share-fallback").hidden = true;
  render();
}
function brief(s: ConditionalSnapshot, title: string): string {
  const j = judgeConditional(s);
  return `<div class="comparison-item"><h3>${esc(title)}</h3><p>${esc(sentenceText(s.sentence))}</p><dl><dt>Current facts</dt><dd>${esc(caseLabel(s.now, s.sentence))}</dd><dt>Admitted cases</dt><dd>${
    CASES.filter((c) => s.allowed & (1 << c))
      .map((c) => esc(caseLabel(c, s.sentence)))
      .join("; ") || "None"
  }</dd><dt>Philo / finite compatibility</dt><dd>${j.philo ? "True" : "False"} / ${j.compatibility === "empty" ? "No model" : j.compatibility}</dd></dl>${!j.currentAllowed ? "<p><strong>The table excludes the current facts.</strong></p>" : ""}${j.compatibility === "passes" && !j.antecedentPossible ? "<p>The finite test passes vacuously: no antecedent-true case.</p>" : ""}</div>`;
}
function render(): void {
  const s = notebook.current;
  const j = judgeConditional(s);
  const v = values(s.now);
  el<HTMLSelectElement>("sentence").value = s.sentence;
  el("scene").innerHTML = conditionalScene(s);
  const day = el<HTMLButtonElement>("toggle-day");
  day.textContent = v.p ? "It is day" : "It is not day";
  day.setAttribute("aria-pressed", String(v.p));
  day.setAttribute("aria-label", `It is day: ${v.p ? "true" : "false"}. Toggle daylight.`);
  const talking = el<HTMLButtonElement>("toggle-talk");
  talking.disabled = s.sentence === "identity";
  talking.textContent =
    s.sentence === "identity" ? "The same day statement" : v.q ? "I am talking" : "I am silent";
  talking.setAttribute("aria-pressed", String(v.q));
  talking.setAttribute(
    "aria-label",
    s.sentence === "identity"
      ? "The consequent repeats the same day statement"
      : `I am talking: ${v.q ? "true" : "false"}. Toggle speech.`,
  );
  el("identity-note").hidden = s.sentence !== "identity";
  el("now-label").textContent =
    `Current: ${caseLabel(s.now, s.sentence)}. Antecedent ${v.p ? "true" : "false"}; consequent ${v.q ? "true" : "false"}.`;
  for (const c of CASES) {
    const impossible = (inherentCases(s.sentence) & (1 << c)) === 0;
    const row = el(`case-row-${c}`);
    row.dataset.current = String(s.now === c);
    row.dataset.impossible = String(impossible);
    el(`case-label-${c}`).textContent = caseLabel(c, s.sentence);
    const check = el<HTMLInputElement>(`allow-${c}`);
    check.disabled = impossible;
    check.checked = (s.allowed & (1 << c)) !== 0;
    el(`allow-label-${c}`).textContent =
      `Admit ${caseLabel(c, s.sentence)}; antecedent ${values(c).p}, consequent ${values(c).q}`;
    const current = el<HTMLButtonElement>(`now-${c}`);
    current.textContent = impossible ? "Unavailable" : s.now === c ? "Current" : "Use now";
    current.disabled = impossible;
    current.setAttribute(
      "aria-label",
      `${impossible ? "Unavailable" : s.now === c ? "Current" : "Use now"}: ${caseLabel(c, s.sentence)}`,
    );
    current.setAttribute("aria-pressed", String(c === s.now));
  }
  el("table-note").textContent =
    s.sentence === "identity"
      ? "Two rows are unavailable because one statement cannot have opposite truth values at the same moment."
      : "The copper row is the true-antecedent / false-consequent pair. It is available whether or not it is current.";
  el("draft-conflict").hidden = j.currentAllowed;
  const philo = el("philo-result");
  philo.textContent = j.philo ? "True here" : "False here";
  philo.dataset.result = String(j.philo);
  el("philo-summary").textContent = `Philo: ${j.philo ? "true" : "false"} at these facts`;
  el("philo-reason").textContent = j.philo
    ? "This pair does not combine a true antecedent with a false consequent. No claim about a connection is needed for this criterion."
    : "The antecedent is true while the consequent is false: exactly the pair Philo excludes.";
  const connection = el("connection-result");
  connection.textContent =
    j.compatibility === "empty"
      ? "No admitted cases"
      : j.compatibility === "fails"
        ? "A counterexample remains"
        : "Passes this table";
  connection.dataset.result = j.compatibility;
  el("connection-summary").textContent =
    `Finite compatibility: ${j.compatibility === "empty" ? "no admitted cases" : j.compatibility === "fails" ? "a counterexample remains" : !j.antecedentPossible ? "vacuous pass" : "passes this table"}`;
  el("connection-reason").textContent =
    j.compatibility === "empty"
      ? "An empty draft supplies no model. Add a case before using this as a compatibility argument."
      : j.counterexample !== null
        ? `${caseLabel(j.counterexample, s.sentence)} is admitted. The antecedent can be true and the consequent false within this table, even if that is not happening now.`
        : "No admitted case combines a true antecedent with a false consequent. The result depends on the exclusions you supplied.";
  el("vacuity-note").hidden = !(j.compatibility === "passes" && !j.antecedentPossible);
  el("use-counterexample").hidden = j.counterexample === null || j.counterexample === s.now;
  for (const id of ["undo", "redo"] as const) {
    const label = id === "undo" ? history.undoLabel : history.redoLabel;
    el<HTMLButtonElement>(id).disabled = !label;
    el(id).textContent = `${id === "undo" ? "Undo" : "Redo"}${label ? ` ${label}` : ""}`;
  }
  if (el<HTMLTextAreaElement>("note").value !== notebook.note)
    el<HTMLTextAreaElement>("note").value = notebook.note;
  el("restore-pinned").hidden = notebook.pinned === null;
  el("comparison-content").innerHTML = notebook.pinned
    ? brief(notebook.pinned, "Pinned experiment") + brief(s, "Current experiment")
    : "";
  el("comparison-note").textContent = !notebook.pinned
    ? "Pin an experiment, then change either the present facts or the admitted cases."
    : notebook.pinned.sentence !== s.sentence
      ? "The sentence has changed. This pair compares different conditionals, rather than one conditional under changed facts."
      : notebook.pinned.now === s.now && notebook.pinned.allowed !== s.allowed
        ? "The present facts and sentence are the same. Only the admitted-case table has changed. A changed verdict therefore comes from changed assumptions."
        : notebook.pinned.now !== s.now && notebook.pinned.allowed === s.allowed
          ? "The sentence and admitted cases are the same. Only the present facts have changed."
          : notebook.pinned.now !== s.now
            ? "Both the present facts and admitted cases have changed. Compare those changes separately."
            : "These snapshots have the same sentence, current facts and admitted cases.";
}

el("toggle-day").addEventListener("click", () =>
  change("daylight", (n) => {
    n.current.now = (n.current.now ^ (n.current.sentence === "identity" ? 3 : 2)) as Case;
  }),
);
el("toggle-talk").addEventListener("click", () =>
  change("speech", (n) => {
    if (n.current.sentence === "speech") n.current.now = (n.current.now ^ 1) as Case;
  }),
);
el("sentence").addEventListener("change", () =>
  change("the sentence", (n) => {
    n.current = initialConditional(el<HTMLSelectElement>("sentence").value as Sentence);
  }),
);
for (const c of CASES) {
  el(`allow-${c}`).addEventListener("change", () =>
    change(`admission of ${caseLabel(c, notebook.current.sentence)}`, (n) => {
      n.current.allowed ^= 1 << c;
    }),
  );
  el(`now-${c}`).addEventListener("click", () =>
    change("the current facts", (n) => {
      n.current.now = c;
    }),
  );
}
el("restore-cases").addEventListener("click", () =>
  change("restoring pairs", (n) => {
    n.current.allowed = inherentCases(n.current.sentence);
  }),
);
el("empty-cases").addEventListener("click", () =>
  change("excluding all cases", (n) => {
    n.current.allowed = 0;
  }),
);
el("admit-current").addEventListener("click", () =>
  change("admitting current facts", (n) => {
    n.current.allowed |= 1 << n.current.now;
  }),
);
el("use-counterexample").addEventListener("click", () =>
  change("the counterexample", (n) => {
    const c = judgeConditional(n.current).counterexample;
    if (c !== null) n.current.now = c;
  }),
);
el("pin").addEventListener("click", () =>
  change("pinning an experiment", (n) => {
    n.pinned = structuredClone(n.current);
  }),
);
el("restore-pinned").addEventListener("click", () =>
  change("restoring the pinned experiment", (n) => {
    if (n.pinned) n.current = structuredClone(n.pinned);
  }),
);
el("reset").addEventListener("click", () =>
  change("the starting experiment", (n) => {
    n.current = initialConditional();
  }),
);
for (const id of ["undo", "redo"] as const)
  el(id).addEventListener("click", () => {
    const next = id === "undo" ? history.undo(notebook) : history.redo(notebook);
    if (next) {
      notebook = next;
      revision++;
      el("share-fallback").hidden = true;
      render();
    }
  });
el("note").addEventListener("input", () =>
  change(
    "explanation",
    (n) => {
      n.note = el<HTMLTextAreaElement>("note").value;
    },
    true,
  ),
);
el("note").addEventListener("blur", () => history.endEdit());

el("save-json").addEventListener("click", () => {
  saveText(
    JSON.stringify(notebook, null, 2),
    "application/json;charset=utf-8",
    "horos-conditional.json",
  );
  message("Saved the editable conditional notebook. Reopen it here; outcomes will be recomputed.");
});
el("save-svg").addEventListener("click", () => {
  saveText(
    conditionalSvg(notebook.current),
    "image/svg+xml;charset=utf-8",
    "horos-conditional.svg",
  );
  message("Saved the current case diagram, including the admitted-case table and its scope.");
});
el("save-html").addEventListener("click", async () => {
  if (exporter) return;
  const request = new AbortController();
  exporter = request;
  const start = revision;
  el<HTMLButtonElement>("save-html").disabled = true;
  el("cancel-export").hidden = false;
  message("Preparing the captured experiment and checking both source pages, fonts and licenses…");
  try {
    const html = await conditionalHtml(notebook, request.signal);
    request.signal.throwIfAborted();
    saveText(html, "text/html;charset=utf-8", "horos-conditional-reading.html");
    message(
      `Saved the complete illustrated reading. ${revision === start ? "It contains this experiment." : "It contains the experiment captured when Save was selected; later edits remain here."} Open it without a connection or print to PDF.`,
    );
  } catch (error) {
    message(
      request.signal.aborted
        ? "Reading preparation canceled. Your experiment is unchanged."
        : errorText(error),
    );
  } finally {
    exporter = null;
    el<HTMLButtonElement>("save-html").disabled = false;
    el("cancel-export").hidden = true;
  }
});
el("cancel-export").addEventListener("click", () => exporter?.abort());
el("open-file").addEventListener("change", async () => {
  const input = el<HTMLInputElement>("open-file");
  const file = input.files?.[0];
  if (!file) return;
  const request = ++importRequest;
  const start = revision;
  try {
    if (file.size > 96_000) throw new Error("Choose a conditional notebook smaller than 96 KB.");
    const parsed = parseConditional(await file.text());
    if (request !== importRequest) return;
    if (revision !== start) {
      message(
        "The file finished reading after your experiment changed. Open it again to replace these newer edits.",
      );
      return;
    }
    change("opening a notebook", (n) => Object.assign(n, parsed));
    message(
      "Opened the conditional notebook and recomputed both tests. Undo restores your previous experiment.",
    );
  } catch (error) {
    if (request === importRequest) message(errorText(error));
  } finally {
    if (request === importRequest) input.value = "";
  }
});
el("copy-link").addEventListener("click", async () => {
  const url = new URL(location.pathname, location.origin);
  url.hash = conditionalLink(notebook);
  el<HTMLTextAreaElement>("share-text").value = url.href;
  el("share-fallback").hidden = false;
  el<HTMLTextAreaElement>("share-text").focus();
  el<HTMLTextAreaElement>("share-text").select();
  try {
    await navigator.clipboard.writeText(url.href);
    message("Copied a link containing both experiments and your explanation.");
  } catch {
    message("Copy the selected notebook link. It contains both experiments and your explanation.");
  }
});

// Source reads have a separate lifecycle from the notebook: a late source or
// a canceled request may never replace the page the learner selected next.
let sourceRequest = 0;
let sourceController: AbortController | null = null;
let sourceUrl: string | null = null;
let currentReading = conditionalReadings[0];
if (!currentReading) throw new Error("The conditional room needs a source reading.");
el("reading").innerHTML = conditionalReadings
  .map((r) => `<option value="${r.id}">${esc(r.title)}</option>`)
  .join("");
el("edition").textContent = conditionalEdition;
el("policy").textContent = conditionalPolicy;

async function showSource(page: number, locate = false): Promise<void> {
  const request = ++sourceRequest;
  sourceController?.abort();
  const controller = new AbortController();
  sourceController = controller;
  const img = el<HTMLImageElement>("source-image");
  img.hidden = true;
  el<HTMLSelectElement>("source-page").value = String(page);
  el("source-status").textContent = `Loading and checking complete printed page ${page}…`;
  try {
    const item = conditionalAsset(`sources/conditionals/mutschmann-p${page}.jpg`);
    const bytes = await verifiedBytes(item, controller.signal);
    controller.signal.throwIfAborted();
    const nextUrl = URL.createObjectURL(new Blob([bytes], { type: item.mime }));
    const decoded = new Image();
    decoded.src = nextUrl;
    try {
      await decoded.decode();
    } catch (error) {
      URL.revokeObjectURL(nextUrl);
      throw error;
    }
    if (request !== sourceRequest || controller.signal.aborted) {
      URL.revokeObjectURL(nextUrl);
      return;
    }
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = nextUrl;
    img.src = nextUrl;
    img.alt = `Mutschmann 1912, complete printed page ${page}, including margins and textual apparatus.`;
    img.hidden = false;
    el("source-status").textContent =
      `Complete printed page ${page}; length and SHA-256 match this edition.`;
    el<HTMLAnchorElement>("source-link").href =
      item.source ?? "https://archive.org/details/sextiempiriciope01sext";
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (request !== sourceRequest) return;
    const viewport = el("source-viewport");
    viewport.scrollTop = locate && currentReading ? currentReading.focus * img.height : 0;
    viewport.scrollLeft = 0;
  } catch (error) {
    if (request !== sourceRequest || controller.signal.aborted) return;
    el("source-status").textContent = errorText(error);
  }
}
function showReading(id: string): void {
  const r = conditionalReadings.find((r) => r.id === id);
  if (!r) return;
  currentReading = r;
  el<HTMLSelectElement>("reading").value = id;
  el("reading-reference").textContent =
    `Outlines ${r.reference} · Mutschmann 1912 · printed page ${r.page}`;
  // Tokenize before escaping; text and learner-visible notes are never parsed as markup.
  const phrases = [...r.words].sort((a, b) => b.greek.length - a.greek.length);
  const pattern = new RegExp(
    `(${phrases.map((w) => w.greek.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gu",
  );
  el("greek").innerHTML = r.greek
    .split(pattern)
    .map((part) => {
      const index = r.words.findIndex((w) => w.greek === part);
      return index < 0
        ? esc(part)
        : `<button type="button" data-word="${index}" aria-pressed="false">${esc(part)}</button>`;
    })
    .join("");
  el("word-note").textContent =
    "Select an underlined Greek phrase to inspect its meaning and teaching Latin.";
  for (const button of el("greek").querySelectorAll<HTMLButtonElement>("[data-word]"))
    button.addEventListener("click", () => {
      const word = r.words[Number(button.dataset.word)];
      if (!word) return;
      for (const b of el("greek").querySelectorAll("button"))
        b.setAttribute("aria-pressed", String(b === button));
      el("word-note").innerHTML =
        `<strong lang="grc">${esc(word.greek)}</strong> · <span lang="la">${esc(word.latin)}</span><p>${esc(word.note)}</p>`;
    });
  el("english").textContent = r.english;
  el("latin").textContent = r.latin;
  el("reading-note").textContent = r.note;
  void showSource(r.page);
}
el("reading").addEventListener("change", () => showReading(el<HTMLSelectElement>("reading").value));
for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-reading]"))
  link.addEventListener("click", () => showReading(link.dataset.reading ?? "philo"));
el("source-page").addEventListener(
  "change",
  () => void showSource(Number(el<HTMLSelectElement>("source-page").value)),
);
el("retry-source").addEventListener(
  "click",
  () => void showSource(Number(el<HTMLSelectElement>("source-page").value)),
);
el("locate-source").addEventListener("click", () => {
  if (currentReading) void showSource(currentReading.page, true);
});
el("zoom-source").addEventListener("click", () => {
  const viewport = el("source-viewport");
  const ratio = viewport.scrollTop / Math.max(1, el<HTMLImageElement>("source-image").height);
  const zoomed = viewport.classList.toggle("enlarged");
  el("zoom-source").setAttribute("aria-pressed", String(zoomed));
  el("zoom-source").textContent = zoomed ? "Fit page" : "Enlarge page";
  viewport.scrollTop = ratio * el<HTMLImageElement>("source-image").height;
  viewport.focus({ preventScroll: true });
});
el("source-viewport").addEventListener("keydown", (event) => {
  const directions: Record<string, [number, number]> = {
    ArrowLeft: [-80, 0],
    ArrowRight: [80, 0],
    ArrowUp: [0, -80],
    ArrowDown: [0, 80],
  };
  const delta = directions[event.key];
  if (!delta) return;
  event.preventDefault();
  el("source-viewport").scrollBy(delta[0], delta[1]);
});

render();
showReading("philo");
installOffline(el("offline-status"));
