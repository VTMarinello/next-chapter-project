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

Required by the course (Part 5, Part 7):

- **HTML, CSS, and JavaScript** must all be present in the submission
- Entry file must be `index.html` in the repo root — GitHub Pages requires this
- No secrets, keys, or personal information anywhere in the repo

Chosen for this project, not imposed by the course:

- **No frameworks and no build step.** The course lists React under things the project "does
  not need" — that is permission to skip it, not a prohibition. Skipping it anyway because
  GitHub Pages serves static files directly, so a build step is a deployment problem the
  project doesn't otherwise have; and because every line has to be explainable out loud, which
  is harder when a framework is doing work invisibly.
- No databases, no APIs, no user accounts — all listed as unnecessary by the course
- CSS and JS in separate files, linked from the HTML

## Code style

Optimised for **explainability over brevity**. The user has to defend every line out loud in an
interview, so the code is deliberately more broken-up than a working programmer would write.

- **Many small, single-job functions.** If a function can't be described in one sentence, split
  it. Twenty functions of four lines each beats four functions of twenty lines — the user is
  never explaining a long function, only a short one.
- **Name functions after what they do**, not how. `snapToNiceFraction`, not `roundHelper`.
- **Comment the *why*, not the *what*.** `// eggs stay fractional — the cook decides whether to
  round` earns its place. `// loop through the array` does not.
- Being a little verbose or "impractical" is acceptable here when it makes a step easier to
  follow. Clarity wins over cleverness every time.
- No one-liner tricks, chained ternaries, or regex without a comment explaining what it matches.

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

## Keeping the documents true

Whenever behaviour changes, the change is only half done until every earlier statement it
contradicts has been corrected. `PLAN.md`, `docs/code-notes.md` and `README.md` all describe how
the app works, and they were written at different times — a fix that makes one of them wrong makes
the project *look* wrong to anyone reading it afterwards.

So after any change to behaviour:

1. Search the markdown files for claims about the thing that changed.
2. Correct them to the new truth, rather than adding a new statement beside the old one.
3. Where the old behaviour is worth remembering — a bug that was fixed, an approach that was
   rejected — say so explicitly as history, not as current fact.

A stale document is worse than a missing one: it is confidently wrong.

## Prompt logging

The `UserPromptSubmit` hook that appended every prompt to `prompt-log-raw.md` was **removed** once
the project was finished. The raw log is complete up to submission and `prompt-history.md` is
curated from it. Do not re-add the hook, and do not append later conversations to either file —
questions asked about the project afterwards aren't part of the deliverable.

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
