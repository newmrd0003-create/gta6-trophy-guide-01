[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/newmrd0003-create/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/newmrd0003-create/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Platinum — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI, built for the [make.fun competition gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01) (pot $250, 50 places, deadline 21 Nov 2026 18:00 WIB).

## What it is

- **Every trophy, official and complete:** all 55 names, descriptions and grades as PlayStation publishes them (1 platinum, 2 gold, 6 silver, 46 bronze), with a guide in our own words for each one that cites its sources.
- **A tracker:** tick trophies off as they pop; progress is saved in the browser (localStorage), with export to a file and import back, plus count boxes for the big grinds (250 stunts, 42 Shooting Range golds, 100 WAiNK locations…).
- **Filters:** by grade and by kind — story, missable, collectibles, activities, heists & economy, and online (the official list has no online trophies, so that filter correctly shows zero).
- **Spoiler-safe:** one switch hides the names and descriptions of story trophies you have not earned yet.
- **Roadmap to the platinum:** five stages in order, from the story through the strands, activities, the map sweep and the final clean-up.
- **Missables flagged:** 16 trophies tied to one named mission, one character's final mission, a partner moment, or a choice — each with why it is flagged and how to recover it.

## Honesty note

GTA VI had not launched when this guide was written. The names, descriptions, grades and PSN counts come from the official list (Exophase and PSNProfiles, 18 Nov 2026); the guide steps are our own reading of those descriptions, and where a description does not pin down a place or a step, the guide says so instead of inventing one.

## Run it

Static files, no build step, no network at run time:

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `app/` with any static server. The app fetches only its own `data/trophies.json`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `buildDossier`.

## Layout

- `app/index.html` — the guide's page
- `app/app.js` — tracker logic (progress, filters, spoiler setting, export/import)
- `app/style.css` — the look (own design, system fonts only)
- `app/data/trophies.json` — the 55 trophies, roadmap and sources
- `screenshots/` — 4 renders of the app itself (see `shots.json`)
- `main.ts` — the entry program; `serve.ts` — local dev server

## License

MIT — see [LICENSE](LICENSE).
