import {
  CASES,
  type ConditionalSnapshot,
  caseLabel,
  sentenceText,
  values,
} from "./core/conditional";
import { htmlEscape as esc } from "./drawing";

export function conditionalScene(s: ConditionalSnapshot): string {
  const { p, q } = values(s.now);
  const bg = p ? "#d9eaf0" : "#123b50";
  const ink = p ? "#173448" : "#f9fcfd";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 300" role="img" aria-labelledby="scene-title scene-desc"><title id="scene-title">${esc(caseLabel(s.now, s.sentence))}</title><desc id="scene-desc">Current facts for ${esc(sentenceText(s.sentence))} The picture represents simultaneous facts, not a causal connection.</desc><rect width="620" height="300" rx="6" fill="${bg}"/><path d="M0 242 Q150 224 310 242 T620 242 V300 H0Z" fill="${p ? "#b8d1dc" : "#0c2e40"}"/>
${p ? '<circle cx="128" cy="100" r="38" fill="#f9fcfd" stroke="#173448" stroke-width="2"/><path d="M128 45V33 M128 155V167 M73 100H61 M183 100H195 M89 61L80 52 M167 139L176 148 M89 139L80 148 M167 61L176 52" stroke="#173448" stroke-width="2"/>' : '<path d="M143 59 A43 43 0 1 0 163 131 A37 37 0 0 1 143 59Z" fill="#f9fcfd"/><circle cx="207" cy="61" r="2.5" fill="#f9fcfd"/><circle cx="68" cy="147" r="2" fill="#f9fcfd"/>'}
<text x="128" y="208" text-anchor="middle" fill="${ink}" font-family="Source Sans, sans-serif" font-size="22">${p ? "It is day" : "It is not day"}</text>
${s.sentence === "identity" ? `<circle cx="448" cy="100" r="38" fill="none" stroke="${ink}" stroke-width="2"/><text x="448" y="108" text-anchor="middle" fill="${ink}" font-family="Literata,serif" font-size="22">${p ? "day" : "night"}</text><path d="M290 94h35m-35 12h35" stroke="${ink}" stroke-width="2"/><text x="448" y="208" text-anchor="middle" fill="${ink}" font-family="Source Sans,sans-serif" font-size="22">The same statement</text>` : `<circle cx="416" cy="96" r="23" fill="none" stroke="${ink}" stroke-width="2.5"/><path d="M378 171V156Q378 127 416 127Q454 127 454 156V171" fill="none" stroke="${ink}" stroke-width="2.5"/>${q ? `<path d="M464 53H558V111H490L475 125V111H464Z" fill="${p ? "#f9fcfd" : "#234d62"}" stroke="${ink}" stroke-width="2"/><path d="M482 72h59m-59 13h45m-45 13h53" stroke="${ink}" stroke-width="2"/>` : `<path d="M481 75l42 42m0-42l-42 42" stroke="${ink}" stroke-width="2"/>`}<text x="432" y="208" text-anchor="middle" fill="${ink}" font-family="Source Sans,sans-serif" font-size="22">${q ? "I am talking" : "I am silent"}</text>`}
<text x="310" y="278" text-anchor="middle" fill="${ink}" font-family="Source Sans,sans-serif" font-size="14">Two clauses at one moment</text></svg>`;
}

export function conditionalSvg(
  s: ConditionalSnapshot,
  title = "Current conditional experiment",
): string {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const labels = CASES.map((c, i) => {
    const y = 130 + i * 58;
    const allowed = Boolean(s.allowed & (1 << c));
    return `<g><rect x="24" y="${y - 27}" width="712" height="50" fill="${s.now === c ? "#d9eaf0" : "#f9fcfd"}" stroke="#9aadb8"/><text x="38" y="${y + 4}" font-size="18">${esc(caseLabel(c, s.sentence))}</text><text x="460" y="${y + 4}" font-size="17">${allowed ? "Admitted" : "Excluded"}</text><text x="612" y="${y + 4}" font-size="17">${s.now === c ? "Current" : ""}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 440" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(sentenceText(s.sentence))}</title><desc id="${id}-desc">Four truth assignments with the selected present case and admitted cases. A modern finite compatibility experiment beside Sextus Empiricus, Outlines II.110–114.</desc><rect width="760" height="440" fill="#eef3f6"/><g fill="#173448" font-family="sans-serif"><text x="24" y="43" font-size="25">${esc(sentenceText(s.sentence))}</text><text x="24" y="78" font-size="16">${s.sentence === "identity" ? "The two clauses share one truth value." : "Daylight and speech are independently assigned."}</text>${labels}<text x="24" y="377" font-size="15">Admitted cases are assumptions. Excluding a row does not prove it impossible.</text><text x="24" y="403" font-size="15">Sextus Empiricus, Outlines II.110–114. Modern diagram by Anthony Mercer.</text></g></svg>`;
}
