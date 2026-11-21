# Leonida Platinum Log — GTA VI Trophy Guide & Tracker

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hizarukuro/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hizarukuro/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI.
Open it, work the roadmap, and tick trophies off as they pop — no account, no network,
no uploads. Your progress never leaves your browser unless you export it yourself.

## What it does

- **Tracker** — all 55 trophies with their official name, description and grade, in
  roadmap order. Check them off as you earn them; progress is saved in your browser
  (localStorage) and can be exported to a JSON file and imported back on any machine.
- **Filters & search** — by type (Story, Missable, Collectibles, Activities, Online,
  Not earned), by grade, or by text.
- **Counters** — trophies that track a number (42 Shooting Range golds, 250 stunts,
  100 WAiNK locations, 500 choices, $250,000 laundered…) get a − / + counter that
  fills as you go and checks the trophy off when the target is reached.
- **A guide for every trophy** — written for this app: what the trophy asks, the
  natural way to earn it, the right order to attempt it, and the pitfalls. Where the
  official description does not settle a detail, the guide says so instead of
  inventing one. Every guide names its sources beside it.
- **Roadmap to Platinum** — six stages in earn order: the story (with stranger
  finales finished before the finale), strangers & errands, activities, the great
  location sweep, free-roam feats, and the 100% finish.
- **Missables view** — the trophies whose own official descriptions tie them to a
  chapter, a mission or a one-time event, each flagged with the reasoning quoted
  from its description.
- **Spoiler shield** — hide the names and descriptions of story trophies you have
  not earned yet, in the tracker, the roadmap and the guide panel.
- **Sources view** — where the official list comes from, printed as text.

## Data & sources

The trophy names, descriptions and grades in `app/data/trophies.json` are the
official list exactly as published for PlayStation 5 on 18 November 2026. The list
is published by PlayStation and listed by Exophase (exophase.com) and PSNProfiles
(psnprofiles.com); those are the sources cited beside every trophy's guide. The
guides themselves are original to this app — no text is copied from any guide site,
and no Rockstar Games artwork or logos are used.

## Run it

The app is plain static files under `app/` with no build step. Either:

- serve the folder with any static server, e.g. `python3 -m http.server -d app 8080`,
  then open `http://localhost:8080`, or
- open `app/index.html` directly in a desktop browser (the trophy data also ships
  as `app/data/trophies.js`, a mirror of the JSON, so the app works from `file://`
  where fetching a local file is not allowed).

It works fully offline: it fetches nothing and loads nothing from the network.

## How the hand-in works

`main.ts` at the repository root is the hand-in program (Node, standard library
only). It copies `app/` and `screenshots/` into the output directory
(`MAKEFUN_OUTPUT_DIR`, or `/output` on the grader) and writes `dossier.json` —
the summary the judge reads — using the vendored make.fun library in `vendor/`:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`screenshots/` holds four captures of the running app: the tracker with a guide
open, the roadmap, the missables view, and the tracker with the spoiler shield on.

Built with make.fun — referral code c23ct4sn
