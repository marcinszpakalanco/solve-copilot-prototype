# How we work on the Solve Copilot prototype

GitHub is the source of truth. Vercel and the Claude artifact only show what is on `main`.

## One change, start to end

1. **Ask.** A change starts from a Figma comment or a request from Marcin. It gets a GitHub issue that links the Figma node.
2. **Branch and PR.** The work goes on a branch named `proto/<short-name>` and opens a PR that follows the template.
3. **Preview.** Vercel builds a preview of every PR on its own address.
4. **Review.** Marcin reviews the look and the code; Razvan can review the code too. One approval is needed to merge.
5. **Merge.** `main` updates solve-copilot-prototype.vercel.app on its own. Claude then rebuilds and republishes the phone artifact.
6. **Close the loop.** Claude replies to the Figma comment with the link, resolves it and closes the issue.

## Checks on every PR

CI must pass before merge: the build, `npm run qa` (every screen at 1440, 768 and 390 in Light and Dark, axe against WCAG 2.2 AA, a focus ring on every Tab stop, reduced motion) and the phone page flow test. Screenshots are kept as the `qa-report` artifact of the run.

## Rules

- `main` always matches the Vercel production address. Nobody pushes to `main` directly.
- Each finished iteration gets a tag (`v0.1.0`, `v0.2.0`) and a CHANGELOG entry.
- Design questions that are settled get a short note in `docs/decisions/`.
- Serenity files are never changed here. Problems in Serenity go to Adam as Figma comments in the library.
- `src/styles/tokens.css` and `src/styles/motion.css` come from the Serenity plugin and are not edited by hand.

## From demo to production

Today the prototype is a demo. It is meant to become the base for production, so new code already follows these rules: real React Aria Components (the artifact shim is only for the phone page), Serenity tokens only, one component per Serenity component. The move to TypeScript is planned before production work starts.
