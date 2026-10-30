# Audit: preserve the argument, explain the counterexample

Reviewed 2026-10-29. This audit began by reproducing behavior in the committed
edition, rather than treating its existing review as proof that editing was safe.

## Try the actual work

1. Open the horse-and-stone investigation. Pin the world and write an explanation.
   Undo names the explanation edit; redo recovers it. Undoing the pin is a separate
   action. A new edit after undo starts a new branch of history.
2. Inspect every possible pattern, then open **Where could the counterexample's
   witness go?** The proposed universal is defeated by **Some C is not A**.
   Object position 5 is available for that witness; B can still be inhabited
   at position 4. Build the displayed witnesses and inspect the resulting world.
3. Open **Take one of the Cs**, inspect the patterns, and open the same explanation.
   Making **Some B is A** false forbids the A-and-B intersection. The two premises
   already force every C into that intersection. The requirement that C has an
   inhabitant therefore has nowhere to be satisfied.
4. Uncheck C's existence requirement. The explanation now constructs a world with
   an object outside all three classes. This is a modern semantic comparison,
   not an allegation that Aristotle made this mistake.
5. Save the illustrated notebook. Its explanation includes the region exclusions
   and witness requirements for each saved world, as well as the Greek readings,
   new English and teaching Latin, and complete source pages.

Direct investigation links use `?investigation=conversion`,
`?investigation=inhabitant`, or `?investigation=chain`. They select the corresponding
starting question and reading. A complete `#notebook=` record takes precedence;
editing does not silently rewrite either kind of link.

## Reproduced defects and corrections

| Trigger in the previous edition                     | Observed failure in Chromium and Firefox           | Correction                                                                                |
| --------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Pin a world, type prose, press Undo                 | Prose vanished with the pin; no redo existed       | Named actions, grouped prose edits, and redo preserve an intelligible, reversible history |
| Hold a file read, then type newer reasoning         | Late import replaced the newer text                | Import requires the original notebook revision; intervening edits are preserved           |
| Start two file reads and resolve the older last     | Older selection could replace the newer notebook   | Only the latest file selection can apply or clear the file control                        |
| Choose the stone substitution, then empty the world | Caption still described the stone and human        | Captions derive from the current world, including after undo and restore                  |
| Render the investigation buttons                    | Replacing the fieldset contents removed its legend | Button insertion preserves the named investigation group                                  |

The first two failures were reproduced before edits in both browsers. The
older-selection race and caption/legend defects were found by inspection and
are exercised in the final browser driver. The teaching Latin's term-example
sentence was also rewritten with finite clauses rather than an awkward
`ad` + infinitive construction. It remains a new teaching abridgment.

History is limited to 100 actions in the current tab. It is not autosave across
reloads. The notebook section tells the learner to save before closing the tab;
JSON, illustrated HTML, and an explicit shared link are the persistence paths.

## An explanation independent of the world search

`src/core/constraints.ts` does not enumerate worlds. It translates each universal
into forbidden object positions and each particular into a witness requirement.
Existence requirements and the nonempty universe add witness requirements too.
The conclusion is negated using the exact contradictories:

| Proposed conclusion | What makes it false |
| ------------------- | ------------------- |
| Every S is P        | Some S is not P     |
| No S is P           | Some S is P         |
| Some S is P         | No S is P           |
| Some S is not P     | Every S is P        |

Remove every forbidden position from every requirement. An empty requirement
makes that attempted world impossible. Otherwise choose one allowed position
for each requirement and combine them. These choices can coexist because the
language has no upper bounds, counting, or identity conditions. The construction
need not minimize the number of objects. The premises are solved separately so
an inconsistent premise set is not presented as an ordinary valid deduction.

The enumerator, the constructive explanation, and the inclusion-exclusion
counting oracle agree on all 1,536 configurations in the model suite. Each
constructed world is independently evaluated as an actual counterexample.
A targeted check identifies **C must have an inhabitant** as the blocked
requirement in the instance-taking question.

## Evidence boundaries

`npm run check` covers 14 tests, strict type checking, lint, source identities,
and the build. `npm run test:browser` exercises all four investigations in
Chromium and Firefox at 1440px and 375px. It operates the witness construction,
undo/redo, held imports, source reading, downloads, saved HTML, and offline
reload. The actual results and file inventory are retained in
[the browser receipt](assets/browser-review.json).

[The edition review](review.md) describes the complete local matrix.
[Publication evidence](publication.md) records public delivery separately.
None of these checks constitutes independent expert review of Aristotle's text.
