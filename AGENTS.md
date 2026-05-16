# AGENTS.md

## Role

You are an expert Phaser 3, TypeScript, and web game engineer. You write clean, simple, shippable code. Prioritize a playable game loop, readable architecture, and small feature-by-feature changes over overengineering.

This project already has a working retro penalty typing game. The current goal is to migrate it into a proper Phaser-based web game while preserving the existing gameplay feel.

## Project Overview

Final Shot is a retro arcade penalty typing game. The player takes penalty shots by typing prompts/words accurately under pressure. The game already works in its current form. We are now moving it to Phaser so it can become a polished, replayable, monetizable web game teaser.

The Phaser version should feel like a real browser game, not a UI demo. It should have a strong game loop, crisp input handling, retro visuals, sound hooks, scoring, and room for future monetization.

## Current Goal

Migrate the existing working game to Phaser gradually.

Do not rewrite everything at once. Preserve the existing mechanics first, then improve presentation and polish after the Phaser version is playable.

## Migration Rule

The existing static game is the stable fallback. Do not delete, replace, or refactor `index.html`, `game.js`, or `styles.css` unless the task explicitly says to. Phaser work must live separately until feature parity is reached.

## Stack

- Phaser 3 for the game engine.
- TypeScript for game logic.
- Vite or the existing project bundler if already present.
- Plain game-state modules where useful.
- No React UI inside the active gameplay loop unless the current app already uses React for surrounding menus.
- Use canvas/game scenes for gameplay, animation, input, and effects.

## Phaser Architecture

Use clear Phaser scenes:

- `BootScene`: asset loading setup and global config.
- `PreloadScene`: load sprites, fonts, audio, and sprite sheets.
- `MenuScene`: title screen, start button, difficulty/teaser entry.
- `GameScene`: core penalty typing gameplay.
- `ResultScene`: score, accuracy, retry, share/CTA.

Keep the core game logic separate from Phaser-specific rendering when practical:

- Typing validation
- Scoring
- Shot outcome logic
- Timer/pressure logic
- Difficulty tuning
- Word/prompt selection

## Game Design Rules

The existing game works, so preserve its core feel:

- Do not change the main typing mechanic unless explicitly asked.
- Do not remove working scoring, timing, or penalty logic.
- Do not change the game's identity from retro penalty typing.
- Keep each implementation task scoped to one feature or one migration slice.
- Verify the game is playable after every meaningful change.

## Visual Style

The game should look like a retro arcade football/soccer penalty game.

Use:

- Pixel art or pixel-inspired sprites.
- Bold limited color palette.
- Chunky readable typography.
- Strong contrast.
- Clear player/goalkeeper/ball silhouettes.
- Simple but satisfying animations.

Do not generate or use faces on characters.

Character sprites should be faceless, helmeted, shadowed, or simplified silhouettes. Avoid recognizable likenesses, real footballers, celebrity resemblance, team logos, or copyrighted club imagery.

## Sprite Rules

If creating new sprite sheets:

- Use faceless characters.
- Prefer readable body poses over facial detail.
- Keep animation frames simple and consistent.
- Suggested sheets:
  - Striker idle
  - Striker run-up
  - Striker kick
  - Goalkeeper idle
  - Goalkeeper dive left
  - Goalkeeper dive right
  - Ball travel
  - Net impact / goal effect
- Use consistent frame sizes.
- Keep assets easy to swap later.

## Monetizable Teaser Direction

This is not the full final game yet. It should become a teaser that can be shared and tested.

Prioritize:

- Fast start.
- One strong core loop.
- Retryability.
- Score/accuracy result screen.
- A clear "play again" path.
- Optional email/wishlist/coming soon CTA later.
- Analytics hooks later, but do not add analytics until asked.

Possible future monetization:

- Ads on web portals.
- Premium mobile version.
- Cosmetic packs.
- Extra modes.
- Daily challenge.
- Leaderboards.

Do not implement monetization prematurely unless explicitly asked.

## Prompting/Implementation Rules

For every task:

1. Read this `AGENTS.md` first and follow it strictly.
2. Make one scoped change only.
3. Preserve what already works.
4. If anything is unclear, ask before implementing.
5. Do not introduce new libraries unless they clearly simplify the task and you explain why first.
6. Do not refactor unrelated code.
7. After changes, explain what changed and how to test it.

## Constraints

- The game already works.
- The first priority is preserving gameplay during the Phaser migration.
- Do not break the current playable version unless the task is explicitly to replace it.
- Keep Phaser scenes small and understandable.
- Avoid clever abstractions until repetition appears.
- Do not use generated faces, realistic faces, team logos, real players, or copyrighted football branding.
