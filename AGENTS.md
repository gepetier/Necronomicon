# Nigganomicron Agent Notes

## Project summary
- Static SPA for a D&D campaign compendium with an old-book / medieval fantasy presentation.
- Main sections: `Personatges`, `Croniques`, `Glossari`.
- Main runtime is Vite with a plain HTML/CSS/JS app, no framework.

## Key files
- `index.html`: app shell.
- `main.js`: primary application logic and UI rendering.
- `styles.css`: styling and responsive behavior.
- `data.js`: base content and seed data.
- `resources/`: local assets for images and voice notes referenced by chronicles.

## Commands
- `npm.cmd run dev`: start local dev server with Vite.
- `npm.cmd run build`: production build to `dist/`.
- `npm.cmd run preview`: preview built app.
- `npm.cmd run qa`: run full QA suite.
- `npm.cmd run qa:functional`: functional QA only.
- `npm.cmd run qa:ui`: UI/layout QA only.
- `npm.cmd run qa:edit`: edit-flow QA only.

## Working conventions
- Prefer minimal, targeted edits. Preserve the existing visual language unless a redesign is requested.
- Keep the app dependency-light and compatible with the current plain-JS structure.
- When changing behavior, verify with the relevant QA command if feasible.
- If a Vite dev server is already running, reuse it instead of launching duplicates.
- Any interface or visual change must be validated visually, not only by code review or build success.
- After each UI modification, generate screenshots of the affected area or screen in the relevant viewport(s).
- Evaluate the screenshots before closing the task. If the result is not satisfactory, iterate on the solution and capture fresh screenshots again.
- For responsive UI changes, check both desktop and mobile unless the task is explicitly limited to one viewport.
- Do not treat a UI task as complete until the screenshot review is satisfactory.

## Session memory
- Use this file as the first place to re-establish project context in future sessions.
- Add short notes here when an important architectural or workflow decision changes.

## Decisions
- Keep project memory in this `AGENTS.md` file rather than relying on session memory.
- Maintain the current plain HTML/CSS/JS + Vite setup unless an explicit migration is requested.
- Treat this file as the canonical restart note when the IDE session is reopened.
- UI workflow decision: every UI-facing change requires screenshot-based review and iteration until the visual result is satisfactory.
- Content workflow decision: when a user provides session prose for `Cròniques`, preserve the full incoming text verbatim in the chronicle body and move structure/order into summary, highlights, and glossary linking.
- Chronicle inline references keep the shared `[[id|label]]` syntax and may target either glossary entries or main character sheets.
- Glossary jumps from `Croniques` must reveal the referenced entry by clearing incompatible glossary filters/search while preserving the return path to the source chronicle.
- Glossary search should be accent-insensitive and also match entry categories, not only names/descriptions/tags.
- Glossary search rerenders the module live, so it must explicitly preserve input focus and caret position while typing.
- Character editing uses a single shared save action for the whole character, and editor save actions should close edit mode after persisting changes.
- Glossary navigation now uses a 3-zone flow: discovery rail (search/category/session), result list, and detail panel, with category and chronicle-session filters acting as the primary navigation controls.
- Glossary result cards should stay minimal: name only plus inline `Edita` / `Esborra` actions, while `Nova entrada` lives under the glossary search box.
- Glossary result rows must only expose action icons on the active row, and the list layout should reserve stable space for wrapped titles instead of compressing cards vertically.
- Glossary session filtering is driven by each entry's `chronicleIds`; checking a session should keep only entries referenced by that session, and glossary jumps from chronicles must clear incompatible session filters too.
- Glossary entries now expose editable `imageAssets` in the glossary editor as newline-separated paths or URLs, because the detail view already supports multiple images and the app has no upload backend.
- Glossary detail entries now surface a short "situacio actual" summary plus a manually editable "ultima vegada vist/visitat a" session marker, with `Llocs` using the visit wording and other categories using seen wording.
- Glossary image insertion now uses the browser's native file picker in the editor, converting selected files into persisted inline data so no manual path entry is required for normal use.

## Pending
- Decide whether to keep the generated capture tooling (`capture-harness.html`, `capture-harness.js`, `capture-runner.mjs`) as part of the permanent UI workflow.
- Clean up or commit the pending visual artifacts and code changes once the current restyle is considered stable.
- Review whether future chronicle passes should also inline glossary links inside raw session prose, or keep verbatim input completely untouched there.
- Decide whether character-reference jumps from `Cròniques` should eventually mirror the glossary return-to-chronicle affordance.

## Next steps
- On next session start, read this file before inspecting code.
- Reuse the existing dev server if port `5173` is already listening.
- After any substantial change, update `Decisions`, `Pending`, and `Last session`.
- For UI tasks, plan time for screenshot capture and review after each visual edit pass.

## Last session
- 2026-04-18: created this project memory file and added persistent restart context.
- 2026-04-18: confirmed the dev server runs with `npm.cmd run dev` on `http://localhost:5173/`.
- 2026-04-21: established mandatory screenshot-based validation for every UI change, with iteration required if the visual result is not satisfactory.
- 2026-04-21: current working tree contains an in-progress UI art-direction pass in `styles.css` plus debounced state/preview updates in `main.js`; latest UI QA passed, but functional/edit QA and fuller screenshot review remain pending.
- 2026-04-22: fixed the Ilu character detail view readability issues by restoring dark text on parchment panels, tightening the desktop portrait layout, and compacting the mobile header/portrait first fold after screenshot review.
- 2026-04-22: reworked the chronicles index to scale better with many entries by adding search, an internal scroll region, and a separate high-contrast `Nova cronica` CTA validated in desktop/mobile screenshots and with a synthetic 50-entry snapshot.
- 2026-04-22: moved the chronicles index into the global sidebar on desktop and kept a shorter inline mobile/tablet version with an internal scroll window sized for roughly three visible sessions.
- 2026-04-24: added a reusable capture harness (`capture-harness.html`, `capture-harness.js`, `capture-runner.mjs`) to export desktop/mobile screenshots for the main UI states into `qa-results/captures/`.
- 2026-04-24: reviewed the main characters/chronicles/glossary interfaces with fresh desktop + mobile screenshots, including second-fold mobile captures for longer views.
- 2026-04-24: improved glossary card description/tag contrast and strengthened editor helper copy contrast; `npm.cmd run qa` passed after the UI retouch.
- 2026-04-24: replaced the three seed chronicles with verbatim session prose for sessions 1-3, reorganized their summaries/highlights, expanded the glossary with the main locations, factions, NPCs, entities, and ritual objects, and added a storage migration for the new seed content.
- 2026-04-24: added glossary image support in the detail panel, imported selected illustrations from the Meledar glossary doc into `resources/glossary/`, linked them to current-campaign glossary entries, and refreshed QA plus capture scenarios around glossary review.
- 2026-04-24: exported the full set of source glossary illustrations into `Glossary/images/` as optimized PNGs with document-derived names for reuse outside the app runtime.
- 2026-04-24: mirrored the current web image assets from `resources/imatges/` into `Glossary/images/` so the export folder now includes both document illustrations and in-app portrait assets.
- 2026-04-25: aligned glossary selection with visible filtered results and added QA coverage for `Croniques -> Glossari -> Croniques` reference navigation.
- 2026-04-25: made glossary search accent-insensitive and added QA coverage for searching `religio` against `Religió`.
- 2026-04-25: fixed glossary search focus loss after each keystroke by restoring focus and caret after live rerender.
- 2026-04-25: consolidated character editing into a single save button and made chronicle/glossary saves close edit mode automatically.
- 2026-04-25: redesigned glossary navigation around search, category menu and alphabetical submenu, with updated functional QA coverage.
- 2026-04-25: simplified glossary result cards to title-only actions and moved glossary creation into the search panel.
- 2026-04-25: corrected glossary result row layout so long titles no longer overlap, widened the central list, and restricted edit/delete icons to the active row after screenshot review.
- 2026-04-25: replaced the glossary alphabetical submenu with session checkboxes backed by `chronicleIds`, added functional QA for session-only filtering, and verified the new UI in desktop/mobile captures.
- 2026-04-25: added glossary image editing support through newline-separated image paths/URLs in the glossary editor, with QA coverage ensuring the saved image renders in the detail view.
- 2026-04-25: added glossary "situacio actual" and "ultima vegada vist/visitat a" metadata to the detail hero, seeded key entries like Acantilado, Uric, Mijo and Reina Elisabeth, and added migration + QA coverage for the new state summary.
- 2026-04-25: replaced manual glossary image entry with a native file-picker flow plus preview/remove controls, while keeping serialized `imageAssets` under the hood for persistence and QA.
- 2026-04-27: extended chronicle inline references so editor suggestions include main characters as well as glossary entries, preserving the selected label text while pointing to either target type, with edit QA and capture review updated accordingly.
- 2026-04-27: expanded final-pass QA coverage to include image lightbox open/close behavior, protection against accidental detail opens from image clicks, and saved chronicle jumps into main character sheets.
- 2026-04-27: added category-based color coding shared between chronicle glossary references, reference suggestions, and glossary category filters, with visual review in desktop and mobile captures.
- 2026-04-27: enabled player notes on character detail views as well, with functional QA covering open/save/close and dedicated desktop/mobile note captures.

## Current known state
- Dev server normally runs through Vite on port `5173`.
- QA artifacts are written to `qa-results/`.
- The project already has `node_modules/` installed.
