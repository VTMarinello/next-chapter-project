---
description: Grade the project against the Part 11 submission checklist
---

Check this project against the submission checklist in `PROJECT-GUIDE.md` Part 11. Verify each
item against reality — actually look. Do not mark something done because it was discussed.

| # | Item | How to actually verify it |
|---|---|---|
| 1 | Public GitHub repository | `gh repo view --json visibility,url` |
| 2 | Working GitHub Pages link | `gh api repos/:owner/:repo/pages` — then fetch the URL and confirm it returns the app, not a 404 |
| 3 | Working application | Open `index.html`, confirm CSS and JS are linked with paths that resolve |
| 4 | README with required sections | All nine from Part 8 present and filled in — not placeholder text |
| 5 | README includes live demo link | The link is present **and** matches the real Pages URL |
| 6 | Prompt history included | `prompt-history.md` exists, is curated, isn't just the raw log renamed |
| 7 | Multiple meaningful commits | `git log --oneline` — several commits, descriptive messages, not one dump |
| 8 | Clear project structure | Separate HTML/CSS/JS, sensible names, no stray files |
| 9 | Features demonstrate value | Compare what's built against the Value section of `PLAN.md` |
| 10 | Code you can explain | `docs/code-notes.md` covers every chunk; ask the user if any part feels shaky |

## Report as

- **Done** — verified, with the evidence
- **Not done** — what's missing and the next action
- **Can't tell** — what's blocking verification

Be blunt about gaps. A checklist that says everything passes when it doesn't is worse than no
checklist. Item 10 in particular is not something you can verify by reading files alone — if
`docs/code-notes.md` has gaps, or the user hasn't been quizzed on recent chunks, say that and
suggest `/quiz`.

End with the single highest-priority thing to fix.
