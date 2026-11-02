import { type ExistenceMap, existenceMap, requirementLabel } from "./core/existence";
import { type Argument, assess, occupied, regionLabel, statement } from "./core/model";
import { htmlEscape } from "./drawing";

export function existenceSummary(map: ExistenceMap): string {
  if (map.minimal.includes(0))
    return "No named class needs an inhabitant for this conclusion to follow. Requiring more inhabitants is unnecessary.";
  if (map.minimal.length)
    return `Weakest sufficient requirements: ${map.minimal.map((mask) => requirementLabel(mask)).join("; or ")}. Each option suffices; every proper subset still permits a counterexample.`;
  return map.rows.some((row) => row.verdict === "invalid")
    ? "No combination of these inhabitant requirements makes this conclusion follow with satisfiable premises. Existence alone cannot repair it."
    : "No combination permits a world satisfying the premises. There is no satisfiable inference to repair.";
}

export function existenceTable(
  argument: Argument,
  map: ExistenceMap,
  currentMask: number,
  world: number,
  interactive = false,
): string {
  return `<table class="existence-table"><caption>Same premises and conclusion; all eight inhabitant requirements. “None” still requires a nonempty universe. Object numbers name membership regions.</caption><thead><tr><th scope="col">Require an inhabitant in</th><th scope="col">Does it follow?</th><th scope="col">Smallest refutation</th></tr></thead><tbody>${map.rows
    .map((row) => {
      const selected = row.mask === currentMask;
      const requirement = requirementLabel(row.mask);
      const verdict =
        row.verdict === "valid" ? "Yes" : row.verdict === "invalid" ? "No" : "No permitted world";
      const buttonLabel = row.mask ? `Require ${requirement}` : "Require none";
      const judgment = assess(argument, world, row.mask);
      const current = !world
        ? "The board is empty."
        : judgment.missing.length
          ? `Board needs ${requirementLabel(judgment.missing.reduce<number>((mask, term) => mask | (1 << term), 0))}.`
          : !judgment.admissible
            ? "A board premise fails."
            : "Board permitted.";
      const numbers = row.smallest === null ? [] : occupied(row.smallest).map((r) => r + 1);
      const objects = `Object${numbers.length === 1 ? "" : "s"} ${numbers.join(", ")}`;
      return `<tr data-existence-row="${row.mask}"${selected ? ' class="selected"' : ""}><th scope="row">${interactive ? `<button type="button" data-require-mask="${row.mask}" aria-pressed="${selected}" aria-label="${buttonLabel}">${requirement}</button>` : requirement}<small>${selected ? "Current setting. " : ""}${current}</small></th><td><strong class="${row.verdict === "valid" ? "true" : "false"}">${verdict}</strong>${row.minimal ? "<small>Weakest sufficient</small>" : ""}<small>${row.permitted} permitted patterns<br />${row.counterexamples} refutations</small></td><td>${
        row.smallest === null
          ? row.verdict === "valid"
            ? "None exists"
            : "Premises cannot hold"
          : interactive
            ? `<button type="button" data-refute-mask="${row.mask}" aria-label="Load refutation: ${objects.toLowerCase()}; ${buttonLabel.toLowerCase()}">${objects}</button>`
            : `<strong>${objects}</strong><ul>${occupied(row.smallest)
                .map((r) => `<li>${htmlEscape(regionLabel(r))}</li>`)
                .join("")}</ul>`
      }</td></tr>`;
    })
    .join("")}</tbody></table>`;
}

export function existenceQuestion(argument: Argument): string {
  return `${argument.premises.map(statement).join(". ")}. Proposed conclusion: ${statement(argument.conclusion)}.`;
}

export function existenceReading(
  argument: Argument,
  currentMask: number,
  world: number,
  label: string,
): string {
  const map = existenceMap(argument);
  return `<section class="existence-reading"><h3>Which inhabitant does the work?</h3><p>${htmlEscape(existenceQuestion(argument))}</p><p>${htmlEscape(existenceSummary(map))}</p><div class="table-scroll" role="region" aria-label="${htmlEscape(label)} inhabitant requirement comparison" tabindex="0">${existenceTable(argument, map, currentMask, world)}</div><p>Unchecked classes may be empty; they are not required to be empty. These rows compare additional assumptions in a modern membership model, not rival readings of Aristotle. A sufficient row must have satisfiable premises. “Weakest” means no proper subset of its requirements suffices; different weakest options need not imply one another.</p></section>`;
}
