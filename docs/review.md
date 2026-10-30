# Local edition review

Reviewed 2026-10-29 in America/Los_Angeles (the machine-readable receipt uses
UTC on 2026-10-30). This page records local evidence. [Publication review](publication.md) separately
records GitHub source, hosted bytes, public browsers, deployment, and CI status.

## Operated browser journeys

Run `npm run build`, then `npm run test:browser`. The driver serves `dist/` on
an isolated local origin and operates real controls and native downloads.

| Browser                | Viewport width | Four investigations | Source pages and downloads | Offline reload/export | Accessibility scan    |
| ---------------------- | -------------- | ------------------- | -------------------------- | --------------------- | --------------------- |
| Chromium 153.0.8010.12 | 1440           | Passed              | Passed                     | Passed                | 0 reported violations |
| Chromium 153.0.8010.12 | 375            | Passed              | Passed                     | Passed                | 0 reported violations |
| Firefox 155.0          | 1440           | Passed              | Passed                     | Passed                | 0 reported violations |
| Firefox 155.0          | 375            | Passed              | Passed                     | Passed                | 0 reported violations |

Each journey:
1. Pins the starting horse illustration, removes its C-and-A representative
   using the keyboard, and places a C outside A. The two premises remain true.
2. Checks all 255 nonempty patterns: with A, B, and C required, 243 violate the
   premises or assumptions, 4 agree, and 8 are counterexamples.
3. Changes the conclusion and confirms that a comparison across changed
   questions is labeled accordingly.
4. Selects a Greek phrase, collects citations, and writes an explanation.
5. Displays all four source pages, comparing the actual image-blob hashes to
   the retained files. Enlarges a page and pans with arrow keys without
   introducing document overflow. Locates all five excerpts in their printed columns,
   checking that the column fits and the excerpt area is visible.
6. Downloads JSON, SVG, and illustrated HTML. Reopens the actual HTML through
   `file://`, checks all embedded image and font hashes, and observes **zero
   HTTP asset requests**. Its native JSON download reopens in the workshop.
7. Reopens an explicit shared link. Edits leave that link unchanged.
8. Operates the conversion, missing-inhabitant, and universal-chain questions.
   Invalid imported facts are rejected without replacing the current work.
9. Refuses all origin connections, also enables the browser's offline mode,
   reloads the document, reads a different source page, and exports again.
   The online and offline HTML downloads are byte-identical in all four runs.

The illustrated HTML was **5,833,588 bytes**, SHA-256
`070e44a0a57e25d163d42b7f1174a54cbe9cae182c622f6f0dada976684746ad`
in every journey. See [browser-review.json](assets/browser-review.json) for
the full 17-file production inventory, browser versions, and fault receipts.
Sixteen files belong to the cached edition; the generated worker is the
seventeenth production file.

The accessibility scan also ran on the standalone notebook. This is automated
checking plus operated keyboard controls, not screen-reader certification or
a claim of comprehensive accessibility conformance.

## Failures exercised deliberately

Both browsers passed the following additional cases (including the [subsequent editing audit](audit.md)):
- Named undo/redo recovers explanation edits separately from board actions.
- A held file import cannot replace intervening edits or a newer file selection.
- Direct investigation links select their own question and source reading.
- Constructed witnesses produce a counterexample; an inhabited C blocks the empty-class example.
- A delayed page 25 response cannot replace the newly selected page 28.
- A same-length JPEG with one changed byte is refused by both reader and export.
- While an export waits on a source request, the live world, explanation, and
  citations change. The download retains the original complete record.
- Markup in a written explanation is escaped, not executed.
- Canceling preparation produces no late download and preserves the live work.
- A damaged file in the current offline cache stops readiness, reading, and
  notebook export.
- Removing that file while retaining a valid copy in another edition's cache
  does not resurrect it. Restoring the correct file to the exact edition
  recovers reading and readiness.

## Corrections made during review

The [editing, explanation, and scan-level audit](audit.md) records the later correction of
prose loss during undo, stale imports, stale substitution captions, and the lost
investigation group label. Its constructive explanation and matching notebook
section are included in the current browser receipt and artifacts.


The enlarged source initially forced its grid column to its image width.
Constraining the column's minimum width keeps the viewport on the page;
explicit arrow-key panning operates its scroll area. The conclusion select
also initially shared the lesson buttons' state marker, which applied an
unsupported ARIA attribute; those markers are now distinct. Side-by-side SVGs
have distinct accessible-name IDs in both the app and standalone notebook.

Firefox's explicit offline mode can reject a `no-store` fetch before the
worker handles it. The asset reader now checks only this document's named
edition cache when offline or after a network failure, and applies the same
length and SHA-256 checks. It does not search unrelated caches, accept corrupt
bytes, or turn an explicit HTTP error into a cached success. This supplements
the separate test with the origin actually refusing connections.

The source service returned 2175 × 2917 images for its `_w1800` requests.
The manifest and viewer use the measured native dimensions. URL parameters
were not treated as image metadata.

## Visual and portable artifacts

The retained screenshots were opened and visually inspected. The diagram has
large direct controls; the phone view keeps the verdict immediately below
those controls. The source reader places Greek beside its scan on desktop,
and in reading order on phones. No horizontal document overflow was observed
at either tested width, including with an enlarged source.

| View                | Desktop                                                                                        | Phone                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Workshop opening    | [Chromium](assets/workshop-chromium-1440.png), [Firefox](assets/workshop-firefox-1440.png)     | [Chromium](assets/workshop-chromium-375.png), [Firefox](assets/workshop-firefox-375.png)     |
| Operable world      | [Chromium](assets/world-chromium-1440.png), [Firefox](assets/world-firefox-1440.png)           | [Chromium](assets/world-chromium-375.png), [Firefox](assets/world-firefox-375.png)           |
| Paired worlds       | [Chromium](assets/comparison-chromium-1440.png), [Firefox](assets/comparison-firefox-1440.png) | [Chromium](assets/comparison-chromium-375.png), [Firefox](assets/comparison-firefox-375.png) |
| Located passage     | [Chromium](assets/located-chromium-1440.png), [Firefox](assets/located-firefox-1440.png)       | [Chromium](assets/located-chromium-375.png), [Firefox](assets/located-firefox-375.png)       |
| Witness explanation | [Chromium](assets/trace-chromium-1440.png), [Firefox](assets/trace-firefox-1440.png)           | [Chromium](assets/trace-chromium-375.png), [Firefox](assets/trace-firefox-375.png)           |
| Greek and source    | [Chromium](assets/reader-chromium-1440.png), [Firefox](assets/reader-firefox-1440.png)         | [Chromium](assets/reader-chromium-375.png), [Firefox](assets/reader-firefox-375.png)         |

The [retained PDF](../examples/two-worlds.pdf) was printed from the actual
downloaded notebook in Chromium. `pdfinfo` reports 25 A4 pages, tagged output,
and no JavaScript. Diagram, Greek-reading, and scan pages were rendered for
visual inspection. Print layout keeps the edition notes together. Browser
print output can vary; no Firefox PDF or physical-print claim is made.

## Code and source checks

`npm run check` passes lint/formatting, strict type checking, 14 tests,
verification of 11 retained source/font/license files, and the production
build. The logic tests include a distinct inclusion–exclusion counting oracle
across 1,536 argument configurations, separate checks of every lesson variant,
and direct quantification over duplicated representatives. They do not claim
independent scholarly validation of Aristotle.

The upstream Literata TTF and Source Sans 3 WOFF2 were fetched again during
review; their SHA-256 values match `public/fonts/provenance.json`. The retained
Literata file is the documented WOFF2 conversion; the Source Sans 3 file is
unmodified upstream data.

The documented development server was also operated in Chromium and Firefox
at 375px: source rendering and the stone counterexample worked, there was no
horizontal overflow or page error, and no service worker registered on the
development origin.

The audited source commit `c614f494177bda02d2818c1eeb7bbe75cf1b7459` was
reproduced from a fresh archive with Node **24.22.1**, `npm ci`, and
`npm run check`. All 14 tests and checks passed. Every one of the **17 production
files** matched both the Node 26.7.0 working build and the browser-reviewed
inventory, including the generated worker. Total output: **4,439,121 bytes**.
[clean-build.json](assets/clean-build.json) records their lengths and hashes.

The initial edition also verified the documented
`gzip -dk examples/two-worlds.html.gz` workflow in a fresh checkout; the current
browser driver opens the downloaded notebook directly and verifies its native
JSON download and all source images. See [publication.md](publication.md) for
public-delivery evidence separate from these local results.
