# When is “if” true? — source and operated review

This change deepens Horos rather than creating another repository. The class
room now links to `conditionals.html`: a present case, an editable table of
admitted cases, a pinned comparison and a Greek reading desk.

## Try the actual work

Build with `npm run build`, then `npm run preview`. Open
`http://127.0.0.1:4369/horos/conditionals.html`.
1. Start with day and talking. Philo's test is true; the finite compatibility
   table still admits day with silence, so that test fails.
2. Pin the experiment. Exclude **Day, silent**, leaving the present facts alone.
   The table now passes. The comparison identifies the changed assumptions.
3. Select **Day, silent** as current. The draft exposes that its own table
   excludes those facts. **Admit the current case** repairs the conflict.
4. Exclude all cases, then admit only night cases. An empty model and a vacuous
   pass have different explanations.
5. Choose the repeated day sentence. Its two clauses cannot disagree. Read the
   fourth account before treating this result as the ancient dispute's answer.
6. Write an explanation and save the reading. Disconnect and reopen it; its
   native JSON download reopens in the room.

## What is primary evidence, and what is a modern model?

| Layer                            | Evidence or convention                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Ancient report                   | Sextus Empiricus, _Outlines of Pyrrhonism_ II.110–114                                                                                   |
| Printed witness                  | Hermann Mutschmann, _Sexti Empirici Opera_ I (1912), pp.92–93                                                                           |
| Retained artifact                | Two complete, unmodified 2096 × 3177 JPEG renditions from the University of Florida scan at Internet Archive                            |
| Reading                          | Six excerpts checked against those images; line endings joined, punctuation normalized, the fourth account's deletion brackets retained |
| Translation                      | New English and teaching Latin; supplied ellipses and Latin abridgments explicitly named                                                |
| Philo computation                | The conditional is false exactly for a true antecedent and false consequent                                                             |
| Finite compatibility computation | Search the learner-supplied admitted cases for that same pair                                                                           |
| Additional assumptions           | Which pairs are admitted, and which pair is current; repeated statements share a truth value                                            |
| Uncomputed accounts              | Diodorus's temporal/modal criterion and potential containment                                                                           |

The complete pages were visually inspected before implementation. The first
scan-data lookup was misleading by one printed page: the downloaded service
rendition at `n124` actually showed printed 93. The retained files therefore use
`n123` for printed 92 and `n124` for printed 93, verified from the numerals and
the visible passages. Captions were not used as proof of image identity.
[Original-page byte comparison](conditional-review/original-pages.json) records
a later fetch of the actual source renditions against the retained files.

The digital First1KGreek text helped locate the passages; the images govern the
displayed transcription. The atomism example stays attributed to the account
being reported. The connection proponents remain unnamed here. Sextus's fourth
account and his circularity objection remain visible instead of being silently
made to agree with modern truth tables. The [source notice](../public/sources/conditionals/NOTICE.txt)
records provenance and text policy.

The program does not decide which cases are truly possible or settle ancient
connection, relevance or necessity. Removing a case manually adds an assumption.
A table with no antecedent-true case passes the finite predicate vacuously;
the interface names that limitation. Empty tables receive no model verdict.
No independent philological review or recovered ancient diagram is claimed.

## Actual browser and artifact evidence

[The local receipt](conditional-review/local.json) records Chromium and Firefox
at 1440px and 375px. Each journey starts in the class room, follows its room
link, changes facts and assumptions, checks a witness, preserves a conflict,
compares snapshots, uses undo/redo, reads all six excerpts, pans a source with
the keyboard, downloads/reopens native files and opens a standalone reading.
Both the workshop and the portable reading produced zero axe violations in
these journeys. This does not replace a human accessibility review.

Both displayed source blobs matched the actual JPEG SHA-256 identities and
2096 × 3177 dimensions. All four embedded binary assets (two JPEGs, two fonts)
matched the retained identities. The HTML contains no scripts and made no
HTTP requests when opened from a file. Its native JSON download retained the
editable record, including Unicode, literal markup and the ungraded explanation.

The fault suites rejected a same-length corrupted scan and refused an export
using it. A delayed page could not replace a newer page selection. Export
cancellation completed without saving. Editing while source preparation was
pending preserved the initial export snapshot and the newer live edits.
A delayed import could overwrite neither intervening work nor a newer file.

The receipt also records two-room reloads and an HTML export after the actual
local server stopped accepting connections. Removing a conditional source from
the current cache withdrew readiness in both rooms; reconnecting and repairing
it restored readiness only after verification. No browser route fulfilled
these offline requests. The expanded `test:readiness` driver additionally
exercises corrupted bytes, foreign editions, ordinary image requests, both
directions of notification and old/new edition activation.

The [class-room regression](conditional-review/class-regression.json) separately
records the four existing Aristotle journeys and fault suites. That receipt
precedes a print-layout-only change to the conditional exporter; its inventory
is retained as observed rather than relabelled as the final build.

Retained illustrations:
- [Conditional desk](assets/conditional-desktop.png)
- [Phone desk](assets/conditional-mobile.png)
- [Greek and complete source page](assets/conditional-reader.png)
- [Editable example](../examples/conditionals/notebook.json)
- [Independent SVG](../examples/conditionals/cases.svg)
- [Complete compressed HTML](../examples/conditionals/reading.html.gz)
- [Actual 23-page browser PDF](../examples/conditionals/reading.pdf)

The PDF's comparison and Greek pages were rasterized and visually inspected.
Print layout starts the model explanation on its own page, keeping it from
trailing across the bottom of a comparison. No physical-printing result is claimed.

## Reproduce

With Node 24 or later and the existing Playwright Chromium/Firefox installations:

```sh
npm ci
npm run check
npm run test:conditionals
npm run test:readiness -- test-results/conditional-readiness
```

The independent logic check covers all 72 legal finite drafts by translating
their admitted pairs into the separate class-membership engine. Existing
syllogistic checks retain their independent inclusion–exclusion oracle.
`npm run build` creates **`dist/`** with base **`/horos/`**. The reviewed edition
contains 25 files totalling 5,956,295 bytes, including the source pages, fonts
and generated worker. The worker verifies 24 retained files (5,949,069 bytes);
the 7,226-byte worker itself is additional. The conditional JavaScript is about 15.6 KB gzip plus
the shared chunk; source retention is a separate background transfer.

## Publication boundary

[The clean-build receipt](conditional-review/clean-build.json) records a fresh
archive of `ca62f87`, a separate `npm ci`, all 18 tests/source checks and a
production build under **Node 24.22.1**. Every one of the 25 files matches the
reviewed Node 26 build byte for byte. The same fresh checkout passed the
[expanded two-room readiness audit](conditional-review/readiness.json),
including both directions of source-loss notification and edition activation.

These are local source, build and browser results. The new room has not been
pushed or deployed: the workspace house standards reserve publication for
review. The existing site's availability does not imply this room is hosted.
No CI execution or package release is claimed.

Suggested repository description: “Build ancient arguments and test what ‘if’
commits you to, with Greek readings and explicit finite models.”

Topics: `ancient-greek`, `aristotle`, `sextus-empiricus`, `logic`, `education`,
`typescript`, `offline`.
