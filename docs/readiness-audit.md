# Horos: offline readiness after source loss

A real source failure could contradict the footer: a page was refused while
“This edition is available offline, including every source page” remained.
The [before receipt](readiness-review/before.json) records the actual public
page and the two observed messages. Earlier checks used a synthetic visibility
event before inspecting readiness, so they did not establish automatic updating.

The public source failure and stale affirmative footer were reproduced in
both Chromium and Firefox. The two-tab follow-up was a local working build
before inventory-wide broadcasts, not a second claim about the older public
source revision.

## The repaired behavior

A verified asset failure asks the current controller to inspect its actual
inventory. Ordinary image/file requests notify every controlled page when the
worker discovers missing or damaged retention. The inventory checker also
broadcasts a discovered failure: a page can read cached bytes directly without
its request reaching the worker. Only the current controller and matching
edition may trigger a page's recheck.

```text
complete -> discovered bad file -> unavailable
    ^                                 |
    +---- whole inventory verified ---+
```

Repeated failures in one damaged episode produce one invalidation notification,
which prevents message-driven rechecks from feeding back into more messages.
A repaired file alone does not establish readiness. The worker verifies the
entire stored inventory before notifying all pages of restoration; each page
then checks that inventory again. Missing storage can remain unavailable even
when a connected file download succeeds.

## Local evidence

The [fresh-archive receipt](readiness-review/clean-build.json) records Node
24.22.2, install, lint, strict types, 14 focused tests, retained-source checks
and a production build. All **17 files**, **4440522 bytes**, match the reviewed
Node 26 build byte for byte. The actual downloaded editable record, SVG and
illustrated HTML remain byte-identical to the existing native examples.

The [browser regression](readiness-review/local-browser.json) repeats Chromium
and Firefox at 1440 and 375 pixels, operates the actual lesson, reads source
pages, opens native files, exports with the origin unavailable and exercises
adversarial source/import behavior. All **24** screenshots were visually
inspected. Deliberately refused HTTP 503 source responses are distinguished from
unexpected errors; no JavaScript exceptions are accepted as part of the fault.

`npm run test:readiness` provides the [independent readiness receipt](readiness-review/local-readiness.json).
It uses two open pages per source-failure case, a real stopped/restarted HTTP
origin with `navigator.onLine` still true, actual native image loads, and no
synthetic inventory event to drive damage or recovery. It checks another edition
holding a healthy copy, an uncached navigation, coalesced notifications,
foreign messages, both pages' recovery, and an old reader holding its edition
while the next one waits. The later audit edition changes only a favicon and
regenerates the complete worker inventory; it is not an application upgrade.

Public file identities, the public browser replay and remote CI remain
separate publication boundaries. The static output is `dist/`; the build command
is `npm run build`.
