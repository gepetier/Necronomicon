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

## Pending
- Start or reuse the Vite server and capture fresh desktop + mobile screenshots for the current UI restyle, reviewing more than the first fold on mobile.
- Re-run `npm.cmd run qa:functional` and `npm.cmd run qa:edit` because `main.js` now debounces persistence and live previews.
- Decide whether the current restyle is ready to keep, then clean up or commit the pending visual artifacts and code changes.

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

## Current known state
- Dev server normally runs through Vite on port `5173`.
- QA artifacts are written to `qa-results/`.
- The project already has `node_modules/` installed.
