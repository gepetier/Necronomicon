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
- `npm.cmd run qa:persistence`: create glossary entries through both UI paths, restart Chrome with a persistent profile after deleting browser cache folders, and verify Local Storage/IndexedDB persistence.

## Working conventions
- Prefer minimal, targeted edits. Preserve the existing visual language unless a redesign is requested.
- Keep the app dependency-light and compatible with the current plain-JS structure.
- Prefer token-light execution: scope searches to likely files first, keep progress updates and final summaries short, avoid repeating long context, and run only the smallest relevant validation unless the change is broad or risky.
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
- Chronicle read pages auto-link known character and glossary names at render time, so the stored prose can remain verbatim while the visible reading view still has references.
- Chronicle inline references keep the shared `[[id|label]]` syntax and may target either glossary entries or main character sheets.
- Glossary jumps from `Croniques` must reveal the referenced entry by clearing incompatible glossary filters/search while preserving the return path to the source chronicle.
- Glossary search should be accent-insensitive and also match entry categories, not only names/descriptions/tags.
- Glossary search rerenders the module live, so it must explicitly preserve input focus and caret position while typing.
- Character editing uses a single shared save action for the whole character, and editor save actions should close edit mode after persisting changes.
- Character `Fitxa` tab should resemble a D&D 5e character sheet, using the existing plain text stats to render ability boxes, saves, skills, combat stats, attacks, equipment, and spellcasting blocks.
- Glossary navigation now uses a 3-zone flow: discovery rail (search/category/session), result list, and detail panel, with category and chronicle-session filters acting as the primary navigation controls.
- Glossary navigation should stay compact: search and create action at the top, category chips visible, chronicle-session filters collapsed by default, and no extra overview panel competing with results.
- Glossary result cards should stay minimal: name only plus inline `Edita` / `Esborra` actions, while `Nova entrada` lives under the glossary search box.
- Glossary result rows must only expose action icons on the active row, and the list layout should reserve stable space for wrapped titles instead of compressing cards vertically.
- Glossary session filtering is driven by each entry's `chronicleIds`; checking a session should keep only entries referenced by that session, and glossary jumps from chronicles must clear incompatible session filters too.
- Glossary entries now expose editable `imageAssets` in the glossary editor as newline-separated paths or URLs, because the detail view already supports multiple images and the app has no upload backend.
- Glossary detail entries now surface a short "situacio actual" summary plus a manually editable "ultima vegada vist/visitat a" session marker, with `Llocs` using the visit wording and other categories using seen wording.
- Glossary image insertion now uses the browser's native file picker in the editor, converting selected files into persisted inline data so no manual path entry is required for normal use.
- Glossary image uploads are optimized client-side before persistence: raster images are resized within 1800x1800 and converted to WebP when the result is smaller; GIF/SVG and failed conversions keep the original file.
- Regular glossary image uploads prioritize reliable immediate preview: the original file is stored first without blocking on raster conversion, and Drive payloads materialize local `asset://` references as image data before sync.
- Shared Drive sync status uses the wax-seal icon set in `resources/sync-status/`, with `synced`, `syncing`, and `unsynced` states rendered in the save toast and Options sync card.
- Rich-text editor reference suggestions are now available in `Personatges`, `Cròniques`, and `Glossari`, and selecting text should also expose a `Multimedia` suggestion that preserves the selected label.
- Rich-text editor reference suggestions include a selected-text search field for linking synonyms or alternate labels to glossary/character targets while preserving the selected label.
- QA suites share the local harness port `4173`, so they should be run sequentially rather than in parallel when validating the app.
- Capture tooling is part of the permanent UI workflow; use filtered captures or `qa:smoke` for fast iteration before full QA.
- QA and capture runners should enforce Chrome timeouts so failed headless runs do not leave long-lived runner processes behind.
- Default workflow should stay token-light: ask/answer with concise summaries, avoid broad repo scans when likely files are known, and prefer focused build/QA/capture aliases over full suites unless the risk warrants it.
- Backup export/import now routes through shared helper functions in `main.js`, so the UI buttons and any QA hooks exercise the same serialization and restore path.
- `qa-runner.mjs` now forces process exit after writing artifacts because the edit suite can otherwise leave Node handles alive after a successful run.
- Rich-text editor previews need their own ink color and contrast treatment instead of inheriting the softer field-label tone, or long prose becomes hard to read.
- Mobile glossary returns from `Cròniques` should render as a short inline back chip at the top of the detail view, not as a bottom floating CTA that competes with reading and notes.
- Character-reference jumps from `Cròniques` mirror glossary jumps by showing the same inline `Torna a la crònica` return chip on the character detail page.
- JSON backup import/export belongs in the `Opcions` module rather than the primary sidebar header.
- `Cròniques` now opens on a visual landing/index page; individual chronicle pages should focus on cover imagery plus the full prose body, without the old order/summary and key-milestones blocks.
- Chronicle reading spreads split the prose body across the left and right book pages, keeping the left page from becoming a mostly empty cover while still avoiding the old order/key-milestones sections.
- Chronicle read pages without a real cover image should render an ornamental session plate instead of an empty placeholder rectangle.
- Desktop sidebar is collapsed by default, only opens preview from hover/focus on the round toggle button, keeps that preview open while the pointer remains inside the sidebar, can be pinned open with the same button, and keeps its content in an internal scroll area; mobile keeps the full stacked navigation.
- Shared persistence now uses Google login plus a Google Apps Script Web App that reads/writes `campaign.json` in Drive; that Drive file is always the sole canonical campaign state, while `data.js` is bootstrap content and localStorage is only a cache/fallback.
- The client stores the public Google OAuth client id and Apps Script `/exec` URL, but no secret token or API key.
- The default capture catalog is intentionally focused instead of exhaustive; use aliases such as `changed`, `characters`, `chronicles`, `glossary`, `options`, `desktop`, or `mobile` for targeted review.
- Persistence now supports a local/Drive campaign catalog; the app still renders one active campaign at a time, while `Opcions` can switch campaigns or create a new starter campaign such as `Savage Worlds`.
- Campaign access now has three canonical roles (`superadmin`, `gm`, `player`), login opens a campaign picker for active accessible campaigns, and the sidebar exposes an accessible-campaign dropdown when more than one campaign is available to the current user.
- Permission decisions live in `app/permissions.js` with unit coverage for the role matrix; full JSON import is restricted to campaign managers, while full JSON export/publish remains limited to users with campaign publish authority.
- Campaign creation, editing, deletion, and active-focus switching now live in the dedicated `Campanyes` sidebar module; `Opcions` only links back to that module instead of hosting campaign management.
- Meledar seed character portraits are repaired during storage sanitization when persisted data contains empty or stale packaged Vite asset paths for `ilu`, `nelthan`, `damakos`, or `elatoris`.
- Savage Worlds campaigns render the character `Fitxa` tab with Savage-specific traits, skills, Parada, Duresa, Bennies, wounds/fatigue markers, and Savage editor labels instead of the D&D 5e sheet.
- Savage Worlds character sheets now support live table state (`bennies`, `shaken`, `wounds`, `fatigue`) inside `character.sheet.savageState`, and weapon rows can be entered in inventory as `Name | Trait | Damage | Notes`.
- Savage Worlds concept help uses a local curated tooltip dictionary rather than an external rules API, avoiding licensing/API availability risk while keeping the interface explainable at the table.
- Savage Worlds sheets are moving toward an assisted-sheet model: wounds/fatigue calculate a visible penalty, armor/equipment lines can be equipped, and equipped armor recalculates derived combat stats.
- The Baskins Savage Worlds campaign auto-seeds Ruth Baskin (`ruth-baskin`) when missing.
- Office mode is a local UI preference (`state.ui.officeMode`) that keeps the same app workflows but applies a neutral document/spreadsheet skin, hides visible media/ornaments, and relabels navigation/UI copy for workplace-safe use.
- Chronicle editor previews should mirror read-mode auto-linking for known character/glossary names, while the textarea still preserves the source text unless the user explicitly inserts a `[[id|label]]` reference.
- Chronicle reference suggestions include a quick `Nova entrada` glossary flow that creates a minimal glossary entry, optionally stores an optimized inline image, links it to the active chronicle, and inserts the reference into the selected text.
- Campaign cards keep their edit forms collapsed behind an `Edita campanya` disclosure so the campaign library stays scannable on desktop and mobile.
- Drive authorization is enforced server-side per campaign: loads return only accessible campaigns, non-managers do not receive other users' access rows, and full publications cannot replace permissions they are not allowed to manage.
- Apps Script writes hold a script lock across read/authorize/backup/write, stamp a monotonically increasing `serverSync.revision` plus operation id, and reject stale full-campaign publications.
- Google ID credentials are session-scoped in the client; legacy persistent credentials are removed from `localStorage`.
- Bundled photographic and painted assets use JPEG while PNG is reserved for transparency/UI; `Glossary/images/` remains the unbundled source archive, and stored packaged glossary URLs are repaired to the current seed asset during sanitization.
- Role changes must stay covered both by client permission-unit tests and by Apps Script integration tests with virtual authenticated users for `superadmin`, `gm`, `player`, and unassigned access.
- Cloud saves use a target-aware queue so rapid edits to different records are retained; a queued full-campaign publish supersedes earlier item saves.
- Google ID credentials are exchanged for short-lived opaque Apps Script session tokens through a one-time claim; subsequent JSONP URLs must never carry the Google credential.
- Apps Script item saves create a Drive backup every 20 server revisions, full publications always back up, and only the 40 newest campaign backups are retained.
- The persistence QA suite uses two independent Chrome processes with one temporary profile, removes only cache folders between runs, and verifies glossary descriptions, IndexedDB images, chronicle references, and tooltip content after restart.
- Glossary image selection must keep a visible processing/success/error state across rerenders and prevent saving or closing the editor flow until the selected image is ready; quick glossary creation is atomic when it includes an image.
- Glossary file inputs must be excluded from the generic glossary-card click handler so the native picker input stays connected; upload diagnostics persist a bounded local event log and expose copy/clear controls in the editor.

- Glossary supporting cast uses the dedicated `Personatges secundaris` category; protagonist sheets remain in `Personatges` and hostile figures remain under `Antagonistes`.

## Pending
- Before deploying sync changes, back up the canonical Drive `campaign.json`; never seed or replace it from `data.js`/localStorage without an explicit reviewed import or merge.
- Clean up or commit the pending visual artifacts and code changes once the current restyle is considered stable.
- Validate the Google Apps Script deployment from a real browser session after the OAuth client origins and the bootstrap DM email are confirmed.
- Deploy the 2026-07-16 Apps Script revision before relying on ephemeral server sessions, queued sync confirmation, and bounded/throttled Drive backups in production.

## Next steps
- On next session start, read this file before inspecting code.
- Reuse the existing dev server if port `5173` is already listening.
- After any substantial change, update `Decisions`, `Pending`, and `Last session`.
- For UI tasks, plan time for screenshot capture and review after each visual edit pass.
- For small UI loops, start with `npm.cmd run qa:smoke` or a filtered `npm.cmd run capture -- <alias>` before full `npm.cmd run qa`.
- Keep future task reports compact: changed files, validation run, and only the most relevant caveats or next steps.

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
- 2026-04-28: fixed the desktop `Glossari` editor composition by switching the module into a 2-column edit layout while the glossary editor is open, then revalidated the affected desktop/mobile captures.
- 2026-04-28: documented that rich-editor reference suggestions and the selected-text `Multimedia` action now apply across `Personatges`, `Cròniques`, and `Glossari`, and confirmed `npm.cmd run qa:edit` passes when suites are run sequentially.
- 2026-04-29: re-ran `npm.cmd run qa`, `npm.cmd run qa:edit`, `npm.cmd run test:unit`, and `npm.cmd run build`; all passed when the QA suites were run sequentially on port `4173`.
- 2026-04-29: added dedicated desktop/mobile capture scenarios for the sidebar `Exporta JSON` / `Importa JSON` tools plus focused `Cròniques` read/edit views around the `Fites clau` block, then regenerated `qa-results/captures/`.
- 2026-04-29: extracted shared backup creation/restore helpers in `main.js` and hardened `qa-runner.mjs` to exit cleanly after successful edit-suite runs.
- 2026-04-29: fixed the rich-text editor preview readability by giving the preview frame stronger parchment contrast and explicit dark body text, then revalidated the affected `Cròniques` editor views in desktop and mobile captures.
- 2026-04-29: replaced the mobile `Torna a crònica` floating action with a short inline back chip at the top of the glossary detail view and added dedicated desktop/mobile capture scenarios for the return state.
- 2026-05-18: moved JSON import/export into a new `Opcions` module, refreshed the dedicated options desktop/mobile captures, and confirmed `npm.cmd run qa` passes.
- 2026-05-18: redesigned the `Cròniques` entry flow into a landing/index page, removed the visible order/summary and `Fites clau` blocks from chronicle reading pages, refreshed affected captures, and confirmed `npm.cmd run qa` passes.
- 2026-05-18: added the collapsible desktop sidebar with hover expansion and click-to-pin behavior, plus focused desktop/mobile captures and full QA validation.
- 2026-05-18: added `qa:smoke`, filtered capture scripts, runner timeouts, and `WORKFLOW.md` to make UI iteration faster and less prone to stuck headless Chrome processes.
- 2026-05-18: restricted desktop sidebar preview to the toggle button hover/focus only, made the expanded sidebar content scrollable, refreshed sidebar captures, and confirmed `npm.cmd run qa` passes.
- 2026-05-18: stabilized sidebar preview so toggle hover opens it but pointer leave from the whole sidebar closes it, avoiding button-hover flicker while moving inside the expanded menu.
- 2026-05-18: filled the left chronicle reading page with the opening prose and moved the continuation to the right page, refreshed chronicle read captures, and confirmed `npm.cmd run build` plus `npm.cmd run qa` pass.
- 2026-05-18: improved the chronicle left page by replacing empty image placeholders with an ornamental session plate and shifting more opening prose onto the left page; refreshed chronicle read captures and confirmed `npm.cmd run qa` passes.
- 2026-05-21: reworked glossary detail pages into a cover image plus brief description, detailed text below, and collapsed secondary `Detalls`; added glossary-reference hover tooltips in `Cròniques` with focused desktop/mobile captures plus `npm.cmd run build`, `npm.cmd run qa:functional`, and `npm.cmd run qa:ui` passing.
- 2026-05-22: verified the 2026-05-21 glossary detail and chronicle tooltip implementation, added return-to-chronicle chips for character-reference jumps, trimmed the default capture catalog to focused scenarios, refreshed changed desktop/mobile captures, and confirmed `npm.cmd run build`, `npm.cmd run qa`, and `npm.cmd run test:unit` pass.
- 2026-05-22: rebuilt the character `Fitxa` tab into a D&D 5e-style sheet layout with ability scores, saves, skills, combat, attacks, equipment, and spellcasting blocks; added focused desktop/mobile captures and confirmed `npm.cmd run build`, `npm.cmd run qa`, and `npm.cmd run test:unit` pass.
- 2026-05-22: added Google login plus Google Apps Script/Drive sync scaffolding, configured the provided OAuth client id, Apps Script `/exec` URL, and Drive folder id, added `Opcions > Permisos`, refreshed options captures, and confirmed `npm.cmd run build`, `npm.cmd run qa:functional`, and `npm.cmd run test:unit` pass.
- 2026-05-22: replaced the login overlay with an opaque book-cover landing page, ensured no app content is visible during auth, routed successful logins to `Personatges`, refreshed desktop/mobile landing captures, and confirmed `npm.cmd run build` plus `npm.cmd run qa:functional` pass.
- 2026-05-22: updated the auth landing page to use the provided leather book texture, removed non-login copy, restyled the login control to match the cover, refreshed desktop/mobile landing captures, and confirmed `npm.cmd run build` plus `npm.cmd run qa:functional` pass.
- 2026-05-22: replaced the visible Google login control with the provided transparent sigil centered on the book cover; clicking the sigil triggers Google login while the real Google button remains hidden underneath, with refreshed desktop/mobile captures and `npm.cmd run qa:functional` passing.
- 2026-05-22: added the provided circular cenefa as the auth server-wait indicator (`auth-waiting-server`), added dedicated `auth-waiting` capture scenarios, moved the ritual status text below the ring, refreshed captures, and confirmed `npm.cmd run qa:functional` passes.
- 2026-05-25: added Chronicle Session 4 (`sala-dels-plaers`) with verbatim prose, structured summary/highlights, 16 new glossary entries, updated Session 4 migration to `DATA_VERSION = 9`, added focused Session 4 captures, and confirmed build plus unit tests pass.
- 2026-05-25: simplified the Glossari navigation rail by compacting category filters into chips, moving `Nova` beside search, collapsing session filters by default, removing the overview block, adding focused empty-filter captures, and confirming `npm.cmd run build`, `npm.cmd run test:unit`, and `npm.cmd run qa:ui` pass.
- 2026-05-25: added render-time auto-linking for Chronicle reading prose and moved the book-page split later so the left page is not mostly empty; refreshed Session 3/4 desktop/mobile captures and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, and `npm.cmd run qa:ui` pass.
- 2026-05-25: replaced the auth waiting cenefa with a subtler CSS-only sigil glow plus thin rotating gold ring, changed the login loading text to `Obrint el compendi...`, refreshed auth desktop/mobile captures, and confirmed `npm.cmd run build` plus `npm.cmd run qa:functional` pass.
- 2026-05-25: moved Glossari results directly under the search block inside the left rail, kept category/session filters below them, made the result list internally scrollable on mobile, refreshed glossary desktop/mobile captures, and confirmed `npm.cmd run build` plus `npm.cmd run qa:ui` pass.
- 2026-05-25: added client-side optimization for Glossari image uploads before asset persistence, updated the editor helper copy, and confirmed `npm.cmd run build` plus `npm.cmd run qa:edit` pass.
- 2026-05-25: integrated the generated wax-seal sync icons into the save notice and Options Drive card, cleaned the checkerboard background from the assets, refreshed options desktop/mobile captures, and confirmed `npm.cmd run build` plus `npm.cmd run qa:ui` pass.
- 2026-06-02: added multi-campaign storage with a campaign catalog, `Opcions` campaign switcher/creator defaulting to `Savage Worlds`, Drive payload support for the full catalog, Apps Script character-save synchronization for the active catalog entry, refreshed options captures, and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, `npm.cmd run qa:functional`, and `npm.cmd run qa:ui` pass.
- 2026-06-03: added role-aware campaign selection after login plus a sidebar campaign dropdown for switching between accessible campaigns without requiring campaign-management permission; refreshed auth/sidebar captures and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, `npm.cmd run qa:functional`, and `npm.cmd run qa:ui` pass.
- 2026-06-03: extracted role permission decisions into `app/permissions.js`, added unit tests for superadmin/GM/player/unassigned/local access, simplified `Opcions` for non-manager users, hid restricted JSON tools, refreshed options/sidebar/auth captures, and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, and full `npm.cmd run qa` pass.
- 2026-06-04: moved campaign management into a new `Campanyes` module with create/edit/delete/focus actions, removed the duplicate sidebar switcher, refreshed campaign desktop/mobile captures, and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, `npm.cmd run qa:functional`, and `npm.cmd run qa:ui` pass.
- 2026-06-04: repaired Meledar character portraits when persisted campaign data contains stale packaged asset URLs, added unit coverage, refreshed character desktop/mobile captures, and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, and `npm.cmd run qa:functional` pass.
- 2026-06-04: added Ruth Baskin to Baskins Savage Worlds campaigns, adapted the character sheet/editor for Savage Worlds systems, refreshed Baskins desktop/mobile captures, and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, `npm.cmd run qa:functional`, and `npm.cmd run qa:ui` pass.
- 2026-06-04: improved Savage Worlds table usability with live Bennies/Shaken/Wounds/Fatigue controls, Pace, parsed weapon/action cards, separated Edges/Hindrances, compact no-portrait character plates, refreshed Baskins captures, and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, `npm.cmd run qa:functional`, and `npm.cmd run qa:ui` pass.
- 2026-06-04: added local Savage Worlds concept tooltips with click/tap/keyboard support, fixed mobile tooltip opacity/stacking and sheet contrast/overlap issues, refreshed Baskins captures, and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, `npm.cmd run qa:functional`, and `npm.cmd run qa:ui` pass.
- 2026-06-04: added Savage Worlds assisted calculations for wound/fatigue penalties, effective trait/action labels, equipped armor bonuses, intelligent equipment/loadout cards, richer inventory format hints, dedicated Baskins loadout/penalty captures, and confirmed `npm.cmd run build`, `npm.cmd run test:unit`, `npm.cmd run qa:functional`, and `npm.cmd run qa:ui` pass.
- 2026-06-25: added a persistent token-light workflow preference: concise responses, scoped searches, and focused validation by default.
- 2026-06-26: added selected-text reference search in rich editors, including synonym lookup such as `Gat negre` -> `Avatar de Nisha'ar` and article-tolerant character suggestions such as `l'Ilu` -> `Ilu`.
- 2026-06-26: added toggleable office mode with neutral navigation labels, document/table styling, hidden visual media, focused functional/UI QA coverage, and dedicated desktop/mobile office captures.
- 2026-06-26: made chronicle edit previews show the same auto-linked references as read mode and added a quick glossary-entry modal from selected-text suggestions, with edit/UI QA plus desktop/mobile modal captures passing.
- 2026-07-07: fixed Drive persistence routing for multi-campaign item saves by sending the active `campaignId`, updating Apps Script upserts against that campaign instead of the shared `activeCampaignId`, aligning the Apps Script OAuth client id with the frontend, preventing campaign focus changes from publishing Drive state, and surfacing unverified no-CORS saves distinctly.
- 2026-07-07: hardened glossary Drive sync by sending compact confirmed JSONP updates when image assets are unchanged, preserving existing remote images in Apps Script, and resolving pending cloud targets from current state before upload.
- 2026-07-16: fixed chronicle reference tooltips being clipped by book-page overflow, replaced the tooltip capture with a real inline-reference scenario, and added regression coverage for active-page overflow.
- 2026-07-07: gated compact glossary Drive saves behind an Apps Script capability flag so older deployed backends fall back to full-entry saves instead of using the new image-preserving merge path.
- 2026-07-07: added Drive file diagnostics to Apps Script responses plus `serverSync.savedAt/savedBy` stamps inside `campaign.json` so real backend writes can be verified against the exact Drive file being updated.
- 2026-07-07: changed manual Drive publish to flush any pending item-level save first, and added compact character saves that preserve existing remote portraits when only text/stat fields change.
- 2026-07-07: surfaced cloud sync diagnostics in `Opcions` with frontend/backend sync versions, Apps Script `/exec`, Drive folder id, Drive file id/url, and remote file updated time.
- 2026-07-15: compacted the mobile app header/navigation and collapsed campaign edit forms behind an accessible disclosure; added campaign and office-mode capture scenarios, refreshed desktop/mobile captures, and confirmed build plus functional/UI QA pass.
- 2026-07-15: hardened Drive sync authorization and concurrency, added Apps Script regression tests plus GitHub Actions CI, moved Google credentials to session storage, and confirmed 23 unit tests, production build, and full functional/UI/edit QA pass.
- 2026-07-15: converted the nine bundled glossary illustrations and auth cover from lossless PNG to quality-84/82 JPEG, resized the transparent auth sigil to 768px, removed two unused auth PNGs, added stale glossary-URL repair, and reduced the heavy bundled image set from 26.94 MB to 3.23 MB while preserving reviewed desktop/mobile visuals.
- 2026-07-15: confirmed that Drive `campaign.json` is always the sole canonical data source; local seed and browser storage must never supersede it automatically.
- 2026-07-15: expanded Apps Script tests with virtual Google users covering the complete server-side role matrix, including permission visibility, campaign management, content publication, assigned edits, cross-campaign denial, and unassigned denial; all 29 unit/integration tests pass.
- 2026-07-15: fixed glossary image uploads that could stall during PNG optimization, deduplicated file input/change handling, added visible processing feedback, and materialized local image assets into Drive payloads; validated with the reported 1254x1254 PNG.
- 2026-07-16: completed a security/performance/UI hardening pass: queued Drive saves, ephemeral Apps Script sessions, safe media-source validation, quota-safe local persistence, bounded backups, accessible nested dialog focus, scoped asset hydration, mobile glossary scrolling fixes, dependency audit cleanup, and a two-process Chrome persistence test covering both glossary creation paths plus reference tooltips.

- 2026-07-16: simplified the Chronicles landing by removing the campaign hero and index heading, moved the create action to a final card in the chronicle grid, removed the sidebar brand/office-mode block, kept Office mode in Options, added dedicated landing captures, and confirmed build plus desktop/mobile functional/UI QA pass.

## Current known state
- Dev server normally runs through Vite on port `5173`.
- QA artifacts are written to `qa-results/`.
- The project already has `node_modules/` installed.

- 2026-07-16: fixed glossary image uploads so large selected files show durable progress and success/error feedback, block premature saves, preview before save, and persist after a cache-cleared browser restart; applied the same guarded feedback to quick glossary creation.

- 2026-07-16: traced the native glossary picker failure to the generic [data-glossary-id] click rerender disconnecting the file input, fixed the click/event ordering, and added a persistent visible execution log from picker click through IndexedDB completion.

- 2026-07-16: added the `Personatges secundaris` glossary category, migrated known supporting NPCs out of `Altres`, and added unit, functional, and desktop/mobile visual coverage.
