import { dataUrl, verifiedBytes } from "./assets";
import { conditionalAssets } from "./conditional-assets";
import { conditionalSvg } from "./conditional-drawing";
import { conditionalEdition, conditionalPolicy, conditionalReadings } from "./conditional-readings";
import {
  CASES,
  type ConditionalNotebook,
  type ConditionalSnapshot,
  caseLabel,
  judgeConditional,
  sentenceText,
  values,
} from "./core/conditional";
import { htmlEscape as esc } from "./drawing";

export const finiteBoundary =
  "A finite compatibility model: p and not-q conflict exactly when no admitted case contains both. The admitted cases are supplied assumptions, not observations that establish necessity. This does not reconstruct ancient connection, relevance, Diodorus's temporal/modal criterion, or potential containment.";

export function conditionalSnapshotHtml(s: ConditionalSnapshot, label: string): string {
  const j = judgeConditional(s);
  return `<section class="snapshot"><h2>${esc(label)}</h2><p class="sentence">${esc(sentenceText(s.sentence))}</p>${conditionalSvg(s, label)}<table><caption>Current facts and admitted cases</caption><thead><tr><th>Case</th><th>Antecedent</th><th>Consequent</th><th>Admitted?</th><th>Current?</th></tr></thead><tbody>${CASES.map(
    (c) => {
      const v = values(c);
      return `<tr><th>${esc(caseLabel(c, s.sentence))}</th><td>${v.p ? "True" : "False"}</td><td>${v.q ? "True" : "False"}</td><td>${s.allowed & (1 << c) ? "Yes" : "No"}</td><td>${c === s.now ? "Yes" : ""}</td></tr>`;
    },
  ).join(
    "",
  )}</tbody></table><p><strong>Philo, at the current facts: ${j.philo ? "true" : "false"}.</strong> ${j.philo ? "The current pair is not true-antecedent / false-consequent." : "The antecedent is true and the consequent false."}</p><p><strong>Finite compatibility: ${j.compatibility === "empty" ? "no admitted cases" : j.compatibility}.</strong> ${j.counterexample === null ? "No admitted case contains a true antecedent and false consequent." : `Witness: ${esc(caseLabel(j.counterexample, s.sentence))}.`}</p>${!j.currentAllowed ? '<p class="boundary"><strong>Conflicting draft:</strong> the table excludes the current facts. Repair that conflict before using it as a model of the present.</p>' : ""}${j.compatibility === "passes" && !j.antecedentPossible ? '<p class="boundary">No antecedent-true case is admitted: this table passes vacuously. That alone does not establish the ancient idea of connection.</p>' : ""}${j.compatibility === "empty" ? '<p class="boundary">An empty table supplies no model. It is not presented as proof of a connection.</p>' : ""}</section>`;
}

export async function conditionalHtml(
  record: ConditionalNotebook,
  signal: AbortSignal,
): Promise<string> {
  // Capture before any fetch: edits during preparation belong to the next save.
  const saved = structuredClone(record);
  const retained = new Map<string, string>();
  const notices: string[] = [];
  await Promise.all(
    conditionalAssets.map(async (item) => {
      if (item.mime === "image/jpeg" || item.mime === "font/woff2")
        retained.set(item.path, await dataUrl(item, signal));
      else
        notices.push(
          `<h3>${esc(item.path)}</h3><pre>${esc(new TextDecoder().decode(await verifiedBytes(item, signal)))}</pre>`,
        );
    }),
  );
  signal.throwIfAborted();
  const json = JSON.stringify(saved, null, 2);
  const svg = conditionalSvg(saved.current);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Horos — when is if true?</title><style>
@font-face{font-family:Literata;src:url('${retained.get("fonts/literata.woff2")}')}@font-face{font-family:SourceSans;src:url('${retained.get("fonts/sourcesans3.woff2")}')}*{box-sizing:border-box}body{max-width:1000px;margin:auto;padding:clamp(16px,4vw,48px);background:#eef3f6;color:#173448;font:18px/1.6 SourceSans,sans-serif}h1,h2,.greek,.latin,.sentence{font-family:Literata,serif}h1{font-size:2.6rem}h2{line-height:1.25;margin-top:2em}a{color:#12547a}svg,img{display:block;width:100%;height:auto}svg{max-width:760px}table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;border-bottom:1px solid #9aadb8;padding:.5em;vertical-align:top}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.8rem}.boundary{border-left:3px solid #9d352a;padding-left:1em}.note{white-space:pre-wrap}.greek{font-size:1.2rem;line-height:1.9}.source{break-before:page}.source img{max-height:240mm;object-fit:contain}.words th{min-width:8em}.sentence{font-size:1.3rem}@media print{body{padding:0;background:white;color:#173448;font-size:10pt}h1{font-size:28pt}h2,h3,caption{break-after:avoid}tr,figure{break-inside:avoid}.snapshot,.reading,.model-explanation{break-before:page}.downloads{display:none}a{color:inherit}svg{max-height:100mm}a[href^="http"]:after{content:" (" attr(href) ")";overflow-wrap:anywhere;font-size:8pt}@page{margin:15mm}}
</style></head><body><main><h1>When is “if” true?</h1><p>Horos · a reading and experiment by Anthony Mercer.</p><p class="boundary">${esc(finiteBoundary)}</p><p class="downloads"><a href="data:application/json;charset=utf-8,${encodeURIComponent(json)}" download="horos-conditional.json">Download editable notebook</a> · <a href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" download="horos-conditional.svg">Download current case diagram</a>. Open the JSON in the conditional room. Use the browser's Print command for a PDF.</p><h2>Your explanation</h2><p class="note">${esc(saved.note || "No explanation recorded.")}</p>${saved.pinned ? `<p>${saved.pinned.sentence === saved.current.sentence ? "The snapshots use the same sentence. Compare changes to the current facts and to the admitted cases separately." : "These snapshots use different sentences. They are not the same conditional under changed facts."}</p>${conditionalSnapshotHtml(saved.pinned, "Pinned experiment")}` : "<p>No experiment was pinned.</p>"}${conditionalSnapshotHtml(saved.current, "Current experiment")}<section class="model-explanation"><h2>What the two tests establish</h2><p>Philo's reported criterion is truth-functional: only a true antecedent with a false consequent makes the conditional false. It requires no causal connection. The finite compatibility test asks whether that pair is admitted anywhere in the supplied table. These are different questions.</p><p>The four combinations exhaust two independently bivalent clauses, not the world's possibilities. Repeating ‘it is day’ gives the same statement twice, so its truth values must agree. Removing ‘day, silent’ by hand adds an assumption; it is not evidence that the combination cannot occur. An empty table and a table with no antecedent-true cases are explicitly diagnosed.</p><p>Sextus reports four accounts. This experiment computes no verdict for Diodorus or the potential-containment account. It does not choose a winning school. The report itself challenges how a disputed consequence relation could certify its own criterion.</p></section>${conditionalReadings.map((r) => `<section class="reading" id="reading-${r.id}"><h2>${esc(r.title)}</h2><p>Outlines ${esc(r.reference)} · <a href="#source-${r.page}">complete printed page ${r.page}</a></p><p class="greek" lang="grc">${esc(r.greek)}</p><h3>Close English</h3><p>${esc(r.english)}</p><h3>Teaching Latin · new${r.id === "atoms" || r.id === "dispute" ? " abridgment" : " translation"}</h3><p class="latin" lang="la">${esc(r.latin)}</p><p>${esc(r.note)}</p><table class="words"><caption>Contextual phrase notes</caption><thead><tr><th>Greek</th><th>Teaching Latin</th><th>Meaning here</th></tr></thead><tbody>${r.words.map((w) => `<tr><th lang="grc">${esc(w.greek)}</th><td lang="la">${esc(w.latin)}</td><td>${esc(w.note)}</td></tr>`).join("")}</tbody></table></section>`).join("")}<section><h2>Edition and text policy</h2><p>${esc(conditionalEdition)}</p><p>${esc(conditionalPolicy)}</p></section>${[92, 93].map((page, i) => `<section class="source" id="source-${page}"><h2>Mutschmann 1912 · complete printed page ${page}</h2><figure><img src="${retained.get(`sources/conditionals/mutschmann-p${page}.jpg`)}" width="2096" height="3177" alt="Complete printed Greek page ${page}, with margins and apparatus"><figcaption>Public-domain printed edition. <a href="https://archive.org/download/sextiempiriciope01sext/page/n${123 + i}_w1800.jpg">Original retained page rendition</a>.</figcaption></figure></section>`).join("")}<section class="source"><h2>Retained-file identities</h2><pre>${esc(JSON.stringify(conditionalAssets, null, 2))}</pre><h2>Licenses and provenance</h2>${notices.sort().join("")}</section></main></body></html>`;
}
