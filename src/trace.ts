import { counterexampleTrace } from "./core/constraints";
import { type Argument, REGIONS, regionLabel, statement } from "./core/model";
import { htmlEscape } from "./drawing";

/** Shared explanation for the live experiment and the portable notebook. */
export function traceHtml(argument: Argument, existence: number): string {
  const trace = counterexampleTrace(argument, existence);
  const result = trace.verdict === "inconsistent" ? trace.base : trace.attempt;
  const blocked = result.impossible.map((c) => c.label).join("; ");
  const explanation =
    trace.verdict === "inconsistent"
      ? `The premises and existence requirements already conflict: ${blocked}. No permitted world exists, even before testing the conclusion.`
      : trace.verdict === "valid"
        ? `No counterexample can be built: ${blocked} has no available region. Every attempted witness would break a condition above. The premises themselves do have permitted worlds.`
        : "Every required witness has an available region. Put one object in the first available region for each requirement; a single object can serve several requirements. All these witnesses can coexist, so this constructs a counterexample without searching 255 worlds. It need not be the smallest one.";
  return `<p>Keep the premises true and make the conclusion false. This asks for <strong>${htmlEscape(statement(trace.denial))}</strong>.</p><p>Universals forbid regions; particular statements and existence assumptions require witnesses. The table lists possible object positions, whether or not your current board uses them.</p><table><caption>Which regions remain available?</caption><thead><tr><th scope="col">Object position</th><th scope="col">Condition that forbids it</th></tr></thead><tbody>${REGIONS.map(
    (r) =>
      `<tr><th scope="row">${r + 1}. ${htmlEscape(regionLabel(r))}</th><td>${
        result.exclusions
          .filter((c) => c.regions.includes(r))
          .map((c) => htmlEscape(c.label))
          .join("; ") || "Available"
      }</td></tr>`,
  ).join(
    "",
  )}</tbody></table><table><caption>Where each required witness could go</caption><thead><tr><th scope="col">Requirement</th><th scope="col">Available object positions</th></tr></thead><tbody>${result.obligations.map((c) => `<tr><th scope="row">${htmlEscape(c.label)}</th><td>${c.regions.map((r) => r + 1).join(", ") || "None — impossible"}</td></tr>`).join("")}</tbody></table><p class="trace-result"><strong>${htmlEscape(explanation)}</strong></p><p class="small">This is a modern explanation using the workshop’s membership rules, not a transcription of Aristotle’s proof.</p>`;
}
