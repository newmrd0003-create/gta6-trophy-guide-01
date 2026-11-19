# Leonida Platinum — GTA 6 Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/newmrd0003-create/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/newmrd0003-create/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5: every trophy with its official name, description and grade, a guide in our own words that names its sources, a five-stage roadmap to the platinum, and the 13 missable trophies flagged — with a checklist that saves in the browser, filters by kind, a spoiler setting, counters for the counted trophies, and export/import of progress.

Built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun ($250, 50 paid places, deadline 21 Nov 2026 18:00 WIB).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network needed. The app is plain static files under `app/`; it loads nothing but its own files and works with the network off.

## What is inside

- **55/55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden on PlayStation, 0 online. Names, descriptions and grades are PlayStation's own, as Exophase and PSNProfiles published them; every guide is written in our own words and cites its sources beside the trophy.
- **Tracker** — check trophies off, progress saved in localStorage, export to a file and import it back, per-trophy counters for the counted ones (42 shooting-range golds, 250 stunts, 100 WAiNK scans, and the rest).
- **Filters** — by kind (story, missable, collectibles, activities, online) and by grade, plus search. The online filter shows the honest answer: the list is single-player only, so it is empty.
- **Spoiler setting** — hides the names and descriptions of story trophies until they are earned.
- **Roadmap** — five stages in order, from the story (first, because the game has no mission replay — keep a manual save before every story mission) through character strands, collectibles, activities and crime, to the 100% cleanup and the platinum.
- **Missables** — 13 flagged: the 12 story-progression trophies plus Positive Mental Attitude, whose Chapter 1 meditation guides flag as one-time.

## Layout

- `app/index.html` — the page: header with progress, tabs, toolbar, checklist + guide pane, roadmap and missables views.
- `app/app.js` — the whole app: loading, state, filters, spoiler rule, counters, export/import, demo views.
- `app/style.css` — the Vice-night look (original, no Rockstar artwork).
- `app/data/trophies.json` — the 55 trophies, the roadmap stages and the sourcing notes.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the output folder and writes `dossier.json` with the make.fun library in `vendor/`.
- `serve.ts` — a tiny static server for local tries.
- `screenshots/` — 4 real renders of the app (see `shots.json` for the views).

## Sources

- Exophase — GTA VI trophy list (official names, descriptions, grades): https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — GTA VI trophies (grades and PSN counts): https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- U7BUY — GTA 6 trophies guide (Chapter 1 meditation, 100% checklist, no mission replay, unverified hidden triggers): https://www.u7buy.com/blog/gta-6-trophies/

Where a guide uses a fact beyond the official description, the trophy's own sources name the guide it came from. Where the trigger is still unverified in published guides (Bad Luck, I Guess; The Truth Is Out There), the guide says so plainly instead of inventing a method.

## License

MIT — see `LICENSE`.
