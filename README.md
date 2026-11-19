# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/newmrd0003-create/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/newmrd0003-create/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

GTA 6 trophy guide + tracker. Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.

An offline static web app (app/) covering all 55 PlayStation 5 trophies of Grand Theft Auto VI: each with its official name, description and grade, a guide written in our own words with its sources cited (PowerPyx, Exophase, PSNProfiles), a 5-stage roadmap to the platinum, missable flags (the one truly missable trophy — Positive Mental Attitude — plus the 12 story-locked ones, since the game has no mission replay), and a tracker with progress saved in localStorage, export/import, filters by kind and grade, search, and a spoiler setting that hides story trophies until earned. Loads nothing over the network; works with the network off.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

To hand the entry in (writes /output):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=hzw5fs6y&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
