# Solve Copilot · prototype

A clickable prototype of the main Solve Copilot chat screen, built from Serenity 2.0: React Aria Components styled with
Serenity tokens and motion patterns, Light and Dark, every width. A demo today and the base for production later.

```sh
npm install
npm run dev        # open the address it prints
```

Screens: `?screen=new` (default), `thinking`, `streaming`, `answered`, `stopped`, `nav` (menu open, below 1024).
Dark: `?theme=dark`.

`src/styles/tokens.css` and `src/styles/motion.css` come from the Serenity plugin and are never edited by hand.
The Vercel copy uses `deploy/tokens.css` and `deploy/motion.css`, purged by `tools/purge-css.py` to the tokens and
patterns this prototype uses.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build (Vercel runs this) |
| `npm run qa` | Screens, axe, focus and reduced-motion checks after a build; report in `qa/report/` |
| `npm run build:artifact` | Single-file phone page in `artifact/out/`, published as the Claude artifact |
| `npm run test:flow` | Taps through the phone page in Light and Dark |

## Process

How changes are made, reviewed and released: [docs/process.md](docs/process.md). Decisions: [docs/decisions/](docs/decisions/).
