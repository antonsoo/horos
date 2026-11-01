# Audit: the downloaded reading and the waiting edition

This audit reproduced defects in the new conditional room and in the existing
class-room export. The reviewed behavior now includes the document a learner
actually takes away, and the transition from the previously published one-room
site. The initial [source and model review](conditional-review.md) explains the
ancient report and the modern finite model.

## Repairs a learner can observe

| Trigger                                                              | Observed problem                                                                                       | Repaired behavior                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Open the conditional HTML at 375px                                   | Document width was 426px in Chromium and 402px in Firefox                                              | Document stays within the viewport; wide tables scroll in named, keyboard-focusable regions |
| Save a long unbroken explanation                                     | Both exporters could force prose beyond the page                                                       | Notes wrap without changing their saved text                                                |
| Open at 320px                                                        | A retained notice's filename extended beyond the page                                                  | Retained-file headings wrap too                                                             |
| Print complete source pages                                          | A heading could occupy one page while its scan and caption moved to the next                           | Each source scan, heading and caption shares one printed page                               |
| Open a new room while the published old edition controls another tab | Repeated reloads did not finish the update; Firefox could keep saying “Preparing” without a controller | The new room explains saving notebooks, closing all Horos tabs and reopening                |
| Read the fourth account's disputed term                              | “Repeated” could look like an uncomplicated vocabulary equivalence                                     | The contextual note identifies the main-text spelling and apparatus alternatives            |

The example now contains an actual learner explanation of the changed
assumptions. Markup and long-text stress inputs stay in the audit driver rather
than the published lesson example. The [20-page PDF](../examples/conditionals/reading.pdf)
is tagged and includes an outline. Its Greek, table and full-source pages were
rasterized and visually inspected. Physical printing and independent
philological review are not claimed.

## Evidence from operated artifacts

- [Local conditional journeys](conditional-audit/local.json): Chromium and Firefox,
  1440px and 375px; controls, six readers, source blob hashes, native downloads,
  import/share round trips, source failure/cancellation/races and real origin outages.
- [Portable document audit](conditional-audit/portable.json): both rooms in both
  browsers at 320px and 375px. Long notes and literal hostile markup stay text;
  keyboard arrows scroll the conditional truth table; editable JSON round trips;
  source images, fonts and complete license/notice text match retained files.
  File-opened readings issue no HTTP requests.
- [Two-room readiness](conditional-audit/readiness.json): source-loss notification,
  corrupt caches, native image requests, recovery, foreign editions and waiting activation.
- [Published-edition replay](conditional-audit/upgrade.json): the old artifact was
  archived from deployment commit `5dc324e1bf72bb28af4211daef01d83436d23c15`,
  edition `b650d6cb3018691f56a8`. Both browsers retained its notebook download,
  explained the waiting new edition, activated after all Horos tabs closed,
  removed the old cache, reopened the saved notebook and reloaded both new rooms
  with the actual local origin stopped.

The waiting worker is not forced to replace an open edition. The old class page
keeps its original code until closed; the new guidance appears in pages running
the updated code. A JSON file remains the explicit way to preserve unsaved work
before closing tabs.

## Repeat the checks

```sh
npm ci
npm run check
npm run test:conditionals
npm run test:portable
npm run test:readiness -- test-results/readiness
mkdir -p /tmp/horos-old
git archive 5dc324e1bf72bb28af4211daef01d83436d23c15 | tar -x -C /tmp/horos-old
node scripts/edition-upgrade.mjs /tmp/horos-old test-results/upgrade
```

The archived deployment commit is retained in Git history. It is intentionally
fixed rather than using today's moving `gh-pages` branch. For hosted read-only
checks, `REVIEW_BASE=https://antonsoo.github.io/horos/` selects the actual public
site for the conditional and portable drivers; public offline checks deny the
browser's network rather than claiming control over the public origin.

## Publication boundary

These local receipts describe edition `b0fde77e0644f97f96d2`. The
[clean-build receipt](conditional-audit/clean-build.json) records a fresh archive
of `6f0542e`, a separate `npm ci` and `npm run check` under Node 24.22.1.
All 25 files (5,958,326 bytes, including the worker) match the reviewed build.
Canonical hosted-file comparison and public browser review are still required
before claiming the edition is published. No package release or CI
execution is implied by the local results.
