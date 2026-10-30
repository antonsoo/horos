# Publication handoff

This repository is local and has not been pushed, tagged, or deployed.
The showcase house standards reserve those actions for the publication review.
No live-demo or CI-success badge has been added.

Suggested GitHub description:

> Build Aristotle's counterexamples, read the Greek, and carry the reasoning in an offline notebook.

Suggested topics: `aristotle`, `logic`, `ancient-greek`, `latin`,
`interactive-learning`, `philosophy`, `offline-first`.

The intended repository is `https://github.com/antonsoo/horos`; the intended
site is `https://antonsoo.github.io/horos/`. These destinations are metadata,
not verified public resources.

Build with Node 24 or later:

```sh
npm ci
npm run check
```

`npm run build` is included in the check and produces **`dist/`** with base
**`/horos/`**. The Pages workflow builds that directory and prepares a
`gh-pages` branch deployment. The CI workflow is configured to run the checks
and both browser journeys. Neither workflow has been run remotely for this
new repository.

Before presenting it as a published showcase, review the source, deploy the
tested bytes, and independently compare the complete hosted output to the
retained production inventory. Then operate the public desktop/phone and
offline journeys. Source publication, hosted-file equality, browser behavior,
and CI execution need separate evidence.

For Officina, use the title **Horos**, group **Ancient world**, and description:

> Construct Aristotle's horse-and-stone counterexamples, expose an existence
> assumption, and read the Greek beside complete source pages. Keep both worlds
> in a portable illustrated notebook.

Useful search terms are `Aristotle`, `Prior Analytics`, `Analytica priora`,
`Ἀναλυτικὰ πρότερα`, `ὅρος`, `syllogism`, `counterexample`, `ekthesis`,
`ἔκθεσις`, `conversion`, `existential import`, `horse and stone`, and
`Greek Latin philosophy`. Add the catalogue entry after the actual site and
a commit-pinned review exist; the live catalogue has not been changed to point
at an unpublished site.
