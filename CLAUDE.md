# Project Context

This is an admissions project for **Next Chapter**, an AI bootcamp. Full requirements live in
`PROJECT-GUIDE.md`. The plan lives in `PLAN.md`.

## What this project is graded on

Not app sophistication. The stated criterion is: *"Can you effectively work with AI to build
software?"* There is an admissions interview where the user must explain their own code out loud
and answer questions like *"was there a time you questioned or challenged an AI suggestion?"*

## Who you're working with

The user is new to software development. Explain in plain language and define jargon the first
time it appears. They are not hand-typing the code — AI writing it is expected and sanctioned by
the course. The requirement is that they **understand** every piece of it well enough to defend
it in conversation.

## Hard constraints

- Plain **HTML, CSS, and JavaScript** only
- No frameworks (no React), no build step, no databases, no APIs, no user accounts
- Entry file must be `index.html` in the repo root — GitHub Pages requires this
- CSS and JS in separate files, linked from the HTML
- No secrets, keys, or personal information anywhere in the repo

## The working loop

Never build the whole app in one pass. For each chunk in `PLAN.md`:

1. **Build** — implement one chunk, nothing more
2. **Explain** — a fresh read of the resulting code, in plain language, appended to
   `docs/code-notes.md`
3. **Commit** — automatically, one commit per chunk, present tense, then push
4. **Quiz** — ask the user questions about what was just built; find the fuzzy spots

`/build <chunk>` runs all four. The commit is not optional and is not deferred — a giant
end-of-project commit fails a stated course requirement. `/quiz` re-tests any time. `/commit`
exists for ad-hoc commits outside the loop. `/check` grades against the submission checklist.

## Commit messages

Present tense, plain, describing the change. The course's own examples:

```
Create homepage
Add habit form
Display habits
Fix validation bug
Improve layout
```

No multi-paragraph bodies. One line is right for this project.

## Things worth capturing as they happen

These map to interview questions and cannot be reconstructed later. Flag them to the user in the
moment so they land in `prompt-history.md`:

- Any point where the user questions, corrects, or rejects a suggestion
- Bugs: what broke, how it was diagnosed, what actually fixed it
- Verification: how it was confirmed something worked, beyond assuming it did

## Files

| Path | What it is |
|---|---|
| `PROJECT-GUIDE.md` | Course requirements, consolidated. Reference, don't edit. |
| `PLAN.md` | The plan and chunk breakdown. Living document. |
| `docs/code-notes.md` | Plain-English explanation of every chunk built. |
| `prompt-log-raw.md` | Auto-captured prompts. Raw feed — do not hand-edit. |
| `prompt-history.md` | Curated deliverable. Written near submission. |
| `README.md` | The deliverable README. Written last. |
