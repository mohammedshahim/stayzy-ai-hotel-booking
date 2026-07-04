# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is currently empty of application code. It only contains local Claude Code skills under `.claude/skills/`. There is no build, lint, or test tooling configured yet.

When the project code is added, update this file with:
- Build/lint/test commands (including how to run a single test)
- High-level architecture (major modules, data flow, how the frontend/backend/services fit together)

## Installed skills

`.claude/skills/` holds self-contained, project-local skills (real copies, not symlinks):

- `/architect` — before any complex feature. Think before building.
- `/imprint` — after any new UI component. Capture patterns.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
- `/remember save` — when a feature spans multiple sessions.
- `/remember restore` — when returning after a multi-session feature.

These were originally installed via a skill manager (source: `JavaScript-Mastery-Pro/skills`) into a `.agents/skills/` folder with a `skills-lock.json` tracking upstream versions. That folder and lockfile were removed in favor of standalone copies here, so these skills no longer auto-update from upstream — update them manually if newer versions are needed.
