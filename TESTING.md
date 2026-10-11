# Release checks — 11 October 2026

This release preserves the deployed application and numerical model from `b35f4e3`; only documentation and documentation links change. It is an illustrative scenario explorer, not a validated forecast.

## Passed in this release review

- [x] Build: both generated HTML files are identical (139,987 bytes); rebuilding produced no application diff.
- [x] Model: all **26 Node tests passed**, including six preset baseline comparisons, seed reproducibility, all ten technology directions, censoring, task weights, preparation calculations, strict imports and legacy migration.
- [x] Browser: all **16 check groups passed in Chromium 151**, using the existing Playwright package and an isolated QA browser runtime outside the public repository.
- [x] Initial offline loading: three charts, 15 domains and an unanswered profile; `file://` works with networking disabled.
- [x] Controls: all 18 sliders have endpoint meanings, explanations, accessible labels and working glossary/return links; keyboard changes work. All six technology and four social presets load their expected values.
- [x] Recalculation: automatic updates, explicit retry, rapid input changes and latest-input results work. Injected computation failure retains the last valid result and recovers. Social/profile changes do not rerun the global simulation.
- [x] Charts: timeline metric, threshold, sorting and keyboard domain selection work. Reset restores scenario settings while preserving the entered profile; Clear my profile removes answers and notes.
- [x] Career flow: all role choices, custom tasks, confirmation, missing answers, planning year and comparison work without resetting technology assumptions.
- [x] Import/export: download, valid round trip, malformed-input rejection without partial changes, dialog focus and legacy migration pass. Default exports omit the profile; explicit profile exports round trip. Hostile note/task text stays inert.
- [x] Layout: 1440, 768, 390 and 320 px viewports have no page-wide overflow; touch is emulated. Desktop and narrow screenshots were visually reviewed. Internal chart scrolling is intentional. Print media keeps charts and excludes the profile.
- [x] Privacy: offline checks recorded zero HTTP requests and no uncaught errors. Local/session storage remained empty. Public files and all reachable Git-history blobs were scanned for private identifiers, paths, credentials, original profile code and the original HTML hash; no matches. The unchanged original remains outside this repository. Test screenshots and receipts are also outside it.
- [x] Live application: [GitHub Pages](https://nishdel.github.io/ai-work-human-futures/) and its offline download returned HTTP 200 and matched the audited build byte for byte. Profile entry generated no additional requests and no uncaught errors. The existing dedicated repository is public, with Pages serving `main` at `/`.
- [x] Sources/licenses: the three research publications, dates and limited claims were rechecked against ILO/METR primary sources. O*NET attribution terms were rechecked; occupation references were checked in the original release. Existing MIT and separate data-license terms are preserved.

Audited HTML SHA-256: `ae076eb49ea2f4db372d4b90c805bfbf17e008713253fc5e7dda927893996af1`.

## Failed attempts and remaining limits

The initial Chromium and Firefox reruns failed to launch because their previously recorded test binaries were absent. Chromium was recovered with a temporary QA runtime and the entire suite then passed. **Firefox was not rerun successfully in this review**; prior Firefox results do not count as a fresh run. No application failure remains in the completed checks.

Safari, physical phones/tablets, screen-reader usability and physical printing remain untested. Mobile/touch results are emulation, not device certification. No statistical validation of forecasts or resilience is claimed. The historical evidence panel is curated; automatic collection and assumption updates are not implemented.

## Reproduce and review

Run `npm run build` and `npm test`. For browser checks, start `npm run serve`, then use `npm run test:browser` with the environment options described in [README.md](README.md). The scripts do not install dependencies. After a push, check that GitHub Pages reports a successful build for the pushed commit, then compare the live application and published documents with the local release.

Codex performed this release review and verification directly. The existing OmniLAB implementation route targets a different repository. No local-model implementation or savings are claimed, and no shared model, routing or resource configuration was changed.
