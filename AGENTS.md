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

## Session memory
- Use this file as the first place to re-establish project context in future sessions.
- Add short notes here when an important architectural or workflow decision changes.

## Decisions
- Keep project memory in this `AGENTS.md` file rather than relying on session memory.
- Maintain the current plain HTML/CSS/JS + Vite setup unless an explicit migration is requested.
- Treat this file as the canonical restart note when the IDE session is reopened.

## Pending
- No confirmed feature work is currently queued in this file.
- When a new task starts, record only the next 1 to 3 actionable items here.

## Next steps
- On next session start, read this file before inspecting code.
- Reuse the existing dev server if port `5173` is already listening.
- After any substantial change, update `Decisions`, `Pending`, and `Last session`.

## Last session
- 2026-04-18: created this project memory file and added persistent restart context.
- 2026-04-18: confirmed the dev server runs with `npm.cmd run dev` on `http://localhost:5173/`.

## Current known state
- Dev server normally runs through Vite on port `5173`.
- QA artifacts are written to `qa-results/`.
- The project already has `node_modules/` installed.
