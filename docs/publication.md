# Public edition review

Reviewed 2026-10-29 in America/Los_Angeles (2026-10-30 UTC).
- [Workshop](https://antonsoo.github.io/horos/)
- [Public source](https://github.com/antonsoo/horos)
- [Horse-and-stone investigation](https://antonsoo.github.io/horos/?investigation=two-worlds#workshop)
- [Instance-taking investigation](https://antonsoo.github.io/horos/?investigation=inhabitant#workshop)
- [Officina discovery](https://antonsoo.github.io/officina/?q=ekthesis#catalogue)

The public build comes from source commit
`c614f494177bda02d2818c1eeb7bbe75cf1b7459`. It includes the
[scan-level correction and notebook audit](audit.md), not just the first edition's
byte checks. Subsequent receipt and documentation changes do not affect build inputs.

## Separate evidence

| Boundary                           | Result                                                                                                                                                    | Receipt                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Clean source build                 | Fresh archive, Node 24.22.1, `npm ci`, `npm run check`; 14 tests and source checks pass                                                                   | [Clean build](assets/clean-build.json)                                             |
| Canonical hosted files             | All 17 files, 4,439,121 bytes, match the clean build; root and explicit index checked before and after                                                    | [Before](assets/public-bytes-before.json), [after](assets/public-bytes-after.json) |
| Real public browsers               | Chromium and Firefox at 1440px and 375px; four investigations, witness construction, five passage locators, keyboard controls, source bytes and downloads | [Browser receipt](assets/public/browser-review.json)                               |
| Offline behavior                   | Reload, source reading, passage location and illustrated export after the current worker controls the page; browser network disabled                      | [Browser receipt](assets/public/browser-review.json)                               |
| Portable notebook                  | HTML opens through `file://`, no HTTP asset requests, all images/fonts verified, native JSON reopens; online/offline exports match                        | [Notebook](../examples/two-worlds.html.gz), [PDF](../examples/two-worlds.pdf)      |
| Public pinned source and artifacts | Eight raw files match their Git blobs, including Greek readings, audit, JSON, SVG, HTML gzip, PDF and source notices                                      | [Source receipt](assets/public-source.json)                                        |
| Pages deployment                   | `gh-pages` at `/`; deployment commit `ad4e1076ca3458c0f5be20af490526921ae47701`; Pages reports built                                                      | [Publication state](assets/publication-state.json)                                 |
| Source CI                          | The reviewed run reported failure with no executed steps. It supplies no passing-check evidence                                                           | [Publication state](assets/publication-state.json)                                 |

The independently downloaded public notebook is **5,833,588 bytes**, SHA-256
`070e44a0a57e25d163d42b7f1174a54cbe9cae182c622f6f0dada976684746ad`.
All four browser journeys produced the same bytes. Its printed example has
25 tagged A4 pages and no JavaScript; physical printing and Firefox PDF output
were not verified.

Public screenshots were compared with the local visual review. Byte-identical
images reuse the retained local files; differing captures were opened separately.
[Screenshot identities](assets/public/screenshot-identities.json) records both
paths and hashes. There were no page errors, horizontal document overflows, or
automatically reported accessibility violations in the operated journeys. These
checks are not a screen-reader certification or independent scholarly review.

## Reproduce the public browser review

```sh
npm ci
npm run build
REVIEW_BASE=https://antonsoo.github.io/horos/ REVIEW_OUTPUT=test-results/public node scripts/browser.mjs
```

The public mode uses the real site and its real downloads. Its controlled fault
contexts deliberately hold or corrupt selected responses to test refusal and
recovery; ordinary learner journeys do not substitute a local response. Public
mode does not overwrite the retained example notebook or PDF.

`npm run build` produces `dist/` with base `/horos/`. The CI and Pages workflows
remain configured. The recorded local checks, hosted-file comparison, browser
operation, source identity, and actual Pages deployment are separate claims.
