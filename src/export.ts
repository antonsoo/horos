import { assets, dataUrl, verifiedBytes } from "./assets";
import { assess, enumerate, occupied, regionLabel, statement, TERMS } from "./core/model";
import type { Notebook, Snapshot } from "./core/record";
import { diagram, htmlEscape } from "./drawing";
import { argumentFor, lesson } from "./lessons";
import { edition, readings, textPolicy } from "./readings";
import { traceHtml } from "./trace";

export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export function saveText(text: string, type: string, name: string): void {
  saveBlob(new Blob([text], { type }), name);
}
export function snapshotHtml(snapshot: Snapshot, label: string): string {
  const argument = argumentFor(snapshot.lesson, snapshot.kind);
  const judgment = assess(argument, snapshot.world, snapshot.existence);
  const result = enumerate(argument, snapshot.existence);
  return `<section class="world"><h2>${htmlEscape(label)}: ${htmlEscape(lesson(snapshot.lesson).title)}</h2>${diagram(snapshot.world, label)}<p>Required inhabitants: ${TERMS.filter((_, i) => (snapshot.existence & (1 << i)) !== 0).join(", ") || "none"}. The universe must be nonempty.</p><table><caption>Truth in this world</caption><thead><tr><th>Statement</th><th>Truth</th><th>Reason</th></tr></thead><tbody>${[
    ...argument.premises,
    argument.conclusion,
  ]
    .map((p, i) => {
      const j = i < argument.premises.length ? judgment.premises[i] : judgment.conclusion;
      return `<tr><td>${i === argument.premises.length ? "Proposed conclusion: " : "Premise: "}${htmlEscape(statement(p))}</td><td>${j?.truth ? "True" : "False"}</td><td>${htmlEscape(j?.explanation ?? "")}</td></tr>`;
    })
    .join(
      "",
    )}</tbody></table><p><strong>World status: ${judgment.status}.</strong>${judgment.missing.length ? ` Missing required inhabitants: ${judgment.missing.map((t) => TERMS[t]).join(", ")}.` : ""}</p><ul>${
    occupied(snapshot.world)
      .map((r) => `<li>Object ${r + 1}: ${htmlEscape(regionLabel(r))}.</li>`)
      .join("") || "<li>No objects. The draft has an empty universe.</li>"
  }</ul><p>Exhaustive check under these assumptions: ${result.admissible.length} permitted patterns; ${result.agreeing.length} with a true conclusion; ${result.counterexamples.length} counterexamples. Inference: ${result.verdict} in this modern model.</p><h3>Where could the counterexample’s witness go?</h3>${traceHtml(argument, snapshot.existence)}</section>`;
}
export async function notebookHtml(record: Notebook, signal: AbortSignal): Promise<string> {
  const retained = new Map<string, string>();
  const notices: string[] = [];
  await Promise.all(
    assets.map(async (item) => {
      if (item.mime === "image/jpeg" || item.mime === "font/woff2")
        retained.set(item.path, await dataUrl(item, signal));
      else
        notices.push(
          `<h3>${htmlEscape(item.path)}</h3><pre>${htmlEscape(new TextDecoder().decode(await verifiedBytes(item, signal)))}</pre>`,
        );
    }),
  );
  signal.throwIfAborted();
  const json = JSON.stringify(record, null, 2);
  const same =
    record.pinned &&
    record.pinned.lesson === record.current.lesson &&
    record.pinned.kind === record.current.kind &&
    record.pinned.existence === record.current.existence;
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Horos — illustrated reasoning notebook</title><style>
@font-face{font-family:Literata;src:url('${retained.get("fonts/literata.woff2")}')}@font-face{font-family:SourceSans;src:url('${retained.get("fonts/sourcesans3.woff2")}')}*{box-sizing:border-box}body{font-family:SourceSans,sans-serif;line-height:1.6;background:#f4f3ed;color:#26342f;max-width:1000px;padding:clamp(16px,4vw,48px);margin:auto}h1,h2,.greek,.latin{font-family:Literata,serif}h1{font-size:2.5rem}h2{margin-top:2.5rem}a{color:#923922}svg{display:block;max-width:500px;margin:1rem auto}table{border-collapse:collapse;width:100%;font-size:.9rem}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #afb5a6;padding:.5rem}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.8rem}.greek{font-size:1.15rem;line-height:1.9}.note{white-space:pre-wrap}.source{break-before:page}.source img{max-height:240mm;object-fit:contain}.boundary{border-block:1px solid #afb5a6;padding:1rem 0}@media print{body{background:#fff;color:#222;padding:0;font-size:10pt}h1{font-size:25pt}h2,h3,caption{break-after:avoid}tr,figure{break-inside:avoid}.world{break-before:page}.world svg{max-height:85mm}.reading{break-before:page}.edition{break-inside:avoid}.source{break-before:page}.downloads{display:none}a{color:inherit}a[href^="http"]:after{content:" (" attr(href) ")";font-size:8pt;overflow-wrap:anywhere}@page{margin:15mm}}
</style></head><body><main><h1>Two worlds. The same premises.</h1><p>A Horos reasoning notebook · Aristotle, <i>Prior Analytics</i> I.</p><p class="boundary">This notebook records a modern membership experiment beside an ancient text. Truth in one world is separate from validity across all permitted worlds. The diagrams are modern; the English and teaching Latin are new.</p><p class="downloads"><a download="horos-notebook.json" href="data:application/json;charset=utf-8,${encodeURIComponent(json)}">Download editable notebook</a> · <a download="horos-world.svg" href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(diagram(record.current.world))}">Download current diagram</a>. To make a PDF, use your browser’s Print command.</p><h2>Your explanation</h2><p class="note">${htmlEscape(record.note || "No explanation recorded.")}</p><p>Cited passages: ${
    record.citations.length
      ? record.citations
          .map((id) => {
            const r = readings.find((r) => r.id === id);
            return `<a href="#reading-${id}">${htmlEscape(r?.location ?? id)}</a>`;
          })
          .join("; ")
      : "none"
  }.</p>${record.pinned ? `<p>${same ? "The two snapshots use the same premises, proposed conclusion, and existence assumptions." : "These snapshots use different questions or existence assumptions. They are not a paired counterexample under one set of assumptions."}</p>${snapshotHtml(record.pinned, "Pinned world")}` : "<p>No comparison world was pinned.</p>"}${snapshotHtml(record.current, "Current world")}
<section><h2>Why the search is complete</h2><p>With three classes, an object has one of eight yes/no membership patterns. These propositions ask only which regions are occupied, never how many objects occupy them. Keep one object from each occupied region of any world: all four proposition kinds and each existence condition keep their truth values. Thus every possible counterexample has a representative among the 255 nonempty occupancy patterns. The completely empty pattern is an editable draft but not a permitted universe. This proof applies to the defined model, not to all of Aristotle’s logic.</p><p>“Every” and “no” are true if their subject class is empty in this model. “Some” and “some not” require a witness; “some” can include all. Requiring an inhabitant is an additional assumption. The existence experiments do not settle Aristotle’s historical treatment of empty terms. The source’s taking of an instance must be read in its own setting.</p><p>Greek A / B / Γ becomes A / B / C. In I.6 Π / Ρ / Σ becomes A / B / C, with Ν the instance.</p></section>
${readings.map((r) => `<section class="reading" id="reading-${r.id}"><h2>${htmlEscape(r.title)}</h2><p>${htmlEscape(r.location)} · <a href="#source-${r.page}">Printed page ${r.page}</a></p><p lang="grc" class="greek">${htmlEscape(r.greek)}</p><h3>Close English</h3><p>${htmlEscape(r.english)}</p><h3>Teaching Latin · new ${r.id === "two-worlds" ? "abridgment" : "translation"}</h3><p lang="la" class="latin">${htmlEscape(r.latin)}</p><p>${htmlEscape(r.note)}</p><table><caption>Contextual language notes</caption><thead><tr><th>Greek</th><th>Teaching Latin</th><th>Reading note</th></tr></thead><tbody>${r.words.map((w) => `<tr><td lang="grc">${htmlEscape(w.phrase)}</td><td lang="la">${htmlEscape(w.latin)}</td><td>${htmlEscape(w.note)}</td></tr>`).join("")}</tbody></table></section>`).join("")}
<section class="edition"><h2>Edition and text policy</h2><p>${htmlEscape(edition)}</p><p>${htmlEscape(textPolicy)}</p><p>Source: <a href="https://archive.org/details/Bekker1831">Internet Archive, Bekker1831</a>. Compare <a href="https://classics.mit.edu/Aristotle/prior.1.i.html">Jenkinson’s English translation</a>.</p></section>
${[24, 25, 26, 28].map((p) => `<section class="source" id="source-${p}"><h2>Bekker 1831 · complete printed page ${p}</h2><figure><img src="${retained.get(`sources/bekker-p${p}.jpg`)}" alt="Complete printed Greek page ${p}, including the edition’s textual notes"><figcaption>Public-domain printed edition. <a href="https://archive.org/details/Bekker1831/page/n${p + 7}/mode/1up">Source leaf ${p + 7}</a>. Retained file identity below.</figcaption></figure></section>`).join("")}
<section class="source"><h2>Retained-file identities</h2><pre>${htmlEscape(JSON.stringify(assets, null, 2))}</pre><h2>Licenses and provenance</h2>${notices.sort().join("")}</section></main></body></html>`;
}
