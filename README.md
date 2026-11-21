# best-stealth-game-20261121-1759

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Ibnu3456787/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Ibnu3456787/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**SHADOWSHIFT — Night at the Meridian Archive.** A complete, original top-down stealth game that runs in a desktop browser: you are Wren, the night archivist, taking the stolen Meridian Ledger back across three guarded floors — 11 ledger pages, 12 guards on fixed patrols, raycast vision cones, and an exit to reach unseen.

Named systems: VisionConeSystem (raycast cones clipped by cover), PatrolSystem (learnable waypoint routes — press O to see them), SuspicionMeter (gradual detection that bleeds away), AlarmSystem (full detection seals the exit — stay unseen 5s to recover), NoiseSystem (walking is audible, crouching is silent, thrown coins lure guards), CoverSystem (shelves block sight; crouch in a plant to vanish), LightingSystem (lamp pools speed detection, shadows slow it), AudioSynth (footsteps panned by direction, all sound synthesized live), ObjectiveSystem plus ghost ratings per floor (SPECTRE → ROOKIE).

## Run it

```sh
node serve.ts
# open http://localhost:8091
```

Play: WASD move, SHIFT crouch, F / right-click throw a coin at the mouse, O patrol routes, H field manual, M mute, P pause, R restart. Screenshots are real renders of the game's own code, staged by its autopilot: `?shot=cover|patrol|alarm|manual`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `vendor/makefun-game.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=zq0xe8tm&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
