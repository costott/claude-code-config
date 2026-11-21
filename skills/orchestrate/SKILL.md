---
name: orchestrate
description: End-to-end implementation of one change in its own git worktree - scoping, design, implementation, validation, autonomous review rounds and a single self-contained commit. Use when the user invokes /orchestrate.
argument-hint: "[description of the change, or the worktree name to continue]"
disable-model-invocation: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: 'node "$HOME/.claude/hooks/session-title.js"'
---

# /orchestrate

Request: $ARGUMENTS

Follow `~/.claude/rules/coding-principles.md`, `~/.claude/rules/git-workflow.md` and (for Rust) `~/.claude/rules/coding-principles-rust.md` throughout. All modifications happen inside the change's worktree. Never edit the primary checkout.

## 1. Identify the change

1. Run `git worktree list` from the repository, and list `~/.claude/work/<repo>/` (reading the `state.md` of any directory without a matching worktree), where `<repo>` is the repository name from the `origin` remote (the primary checkout's directory name for ordinary projects).
2. Decide whether the request continues an existing change or starts a new, independent one.
   - **Continuing** (always the case for a request naming a change's slug, as the roadmap prints it): read its `state.md`, `decisions.md` and any `plan.md` before anything else. Read its code by path; enter its worktree only as step 5 sets out.
   - **Seeded:** a state directory with `Status: seeded` and a `findings.md` (see Seeding findings) is a new change whose investigation is already started. Treat `findings.md` as input to scoping, not as settled scope, then go to step 2 using the seeded slug (its state directory already exists).
   - **New:** go to step 2.
   - **Ambiguous** (for example, it could belong to an existing change or be separate): ask.
3. If the session is already inside a worktree belonging to a different change, don't use it.
4. Establish which step is being asked for. A request to review a change starts at step 7, with nothing implemented beforehand. Points I add to such a request are input to the review, not instructions to implement.

## 2. Prepare (new changes only)

1. Check the primary checkout is clean and on the default branch. If it isn't, stop and report; don't stash or discard anything.
2. Run `git fetch`. If the default branch is behind its upstream, run `git pull --ff-only` in the primary checkout.
3. Choose a descriptive kebab-case slug and create `~/.claude/work/<repo>/<slug>/state.md` and `decisions.md` (format below). A seeded change already has them: create only a missing `decisions.md`. Scoping and design read the primary checkout; the worktree is created in step 5.

## 3. Understand and scope

1. Name the session (new, seeded and continued changes alike): write `<REPO> | <change>` to `~/.claude/work/<repo>/<slug>/title`, with `REPO` in capitals and `change` a short phrase. The `hooks/session-title.js` UserPromptSubmit hook applies it as the session title on my next prompt, only while the session has no custom title, so a later `/rename` is never overwritten. Tell me once that it applies then, and that `/rename` does it immediately if I want it now.
2. Read the project `CLAUDE.md`, then the knowledge-base documents its index marks as relevant to the area being changed. Don't load the whole knowledge base.
3. Inspect the relevant code before making assumptions. Find existing functionality and patterns the change could reuse or extend.
4. Establish the intended outcome and the scope.
   - If the change isn't adequately scoped, help scope it first.
   - If design decisions, ambiguities or missing requirements are unresolved, ask, batching the questions.
   - Don't ask about anything already clear or discoverable from the repository.
5. Record the agreed scope in `state.md`.

## 4. Design

1. Settle a clear enough design before writing code: the simplest mechanism, existing abstractions, and consistency with the surrounding code.
2. Check the design for unnecessary complexity, duplication of existing functionality, and its effect on the public API surface.
3. Treat my suggestions (names, mechanisms, approaches) as proposals: evaluate them against the alternatives, the code and the knowledge base, and recommend something else if it's better.
4. Write the design as a short implementation plan to `plan.md` in the state directory, present it, and wait for my explicit approval before implementing. Revisions update `plan.md`. Agreeing to the scope or answering design questions is not approval of the design. Record the approval in `decisions.md`, referring to `plan.md`.
5. Record each significant decision in `decisions.md`, with its reason and whether I approved it or it was a routine choice.

## 5. Implement

1. Hold the worktree only while working autonomously through steps 5–8, so other sessions are locked out of it for as little time as possible:
   - before the first modification (implementing once I've approved the design, or fixing review findings), enter it with `EnterWorktree` and `path`. For a new change, create it instead: repeat step 2's clean-checkout check and fetch, run `EnterWorktree` with the slug, then `git branch -m worktree-<slug> <type>/<slug>`. Copy any ignored files the project needs via `.worktreeinclude` (propose adding one if it's missing and required), run the setup steps from the project `CLAUDE.md`, note that build output (e.g. `target/`) starts empty, and record the branch, worktree and base commit in `state.md`;
   - before every hand-back to me (a question, a stop condition, the final report), update `state.md` and leave with `ExitWorktree` (`action: "keep"`).
2. Work autonomously. Don't ask me to micromanage individual steps. If implementation shows the approved design must change materially, stop, update `plan.md` and present the change for approval.
3. Keep the change focused: no unrelated refactoring or opportunistic edits.
4. Add or update tests that pin the intended behaviour.
5. Keep documentation in sync, in the same change:
   - Update any knowledge-base document whose `sources` you changed, and its `verified` commit, following the project `CLAUDE.md`'s sync rule. The knowledge base describes the default branch as it is and why: bugs go in the issue tracker, linked rather than described, and nothing refers to unmerged or local work.
   - Update the README for important user-facing changes.
   - Bump crate versions according to semver when the public API changes.
6. Update `state.md` at meaningful milestones, so another session could resume from it.

## 6. Validate

1. Run the project's validation commands from its `CLAUDE.md`. Typically these are formatting, clippy on changed code, and tests.
2. Compare the results against the documented baseline, so pre-existing failures are distinguished from new ones.
3. Confirm the change actually works. Run the relevant example or scenario where tests can't show it.
4. For performance work, take before and after measurements.
5. Never claim success without evidence.

## 7. Review rounds

Skip review rounds for changes to `~/.claude`: I review their diff myself before they're committed.

Review repeats autonomously, as step 4 sets out, so I don't need to prompt each round. Never present unfinished work.

1. Invoke the `review` skill (Skill tool, `review`). Pass it:
   - the original request and agreed scope;
   - the design decisions from `decisions.md`, marking which I approved;
   - any implementation context the reviewer needs;
   - the validation results;
   - the worktree path;
   - in round 1 only, when the change touches `unsafe` code or threading and synchronisation, a request to run the reviewer on Opus (a spawn setting for `/review`, not part of the brief).
   From round 2, also pass the previous rounds' findings and what was done about each, so the reviewer doesn't re-report resolved points. Disputed findings aren't resolved: it should judge them afresh.
2. The reviewer only reports findings. Making changes stays your responsibility.
3. Address every finding of any severity: fix it, or, if you disagree, record why in `decisions.md`.
4. Revalidate after any fixes. Start another round if any fix was substantive or any finding was disputed, so the reviewer can confirm or re-raise. A fix is trivial only if it changes no behaviour or meaning (a typo, a rewording, a formatting or naming slip, whatever the finding's severity). Trivial fixes need no round: check them yourself and finish.
5. **Stop and report to me, without fixing further, when:**
   - two reviews contradict each other, including a finding that asks to undo an earlier round's fix;
   - a finding is re-raised after you fixed it or recorded a disagreement with it;
   - a finding challenges a decision I made or approved (marked in `decisions.md`);
   - a finding involves another material decision I haven't made.
   State the findings, the conflict or the decision at stake, and your recommendation. Resume when I've resolved it.

## 8. Commit and report

1. Commit in the worktree as a single self-contained commit. If this change already has a commit, amend it.
   - Stage explicit paths only.
   - Check `git status` and `git diff --staged` for unrelated changes.
   - Use a concise British English message that describes the change.
   - No AI attribution of any kind.
2. Fetch and rebase onto the upstream default branch, then re-run validation if anything changed after the last run, including commits the rebase brought in.
3. Push and open or update the PR as the Integrate step of `git-workflow.md` sets out. If step 7 stopped, or validation fails, don't push. In `~/.claude`, follow its exception in `git-workflow.md` instead: show me the diff and wait for my agreement.
4. Report concisely:
   - what changed;
   - validation results;
   - review outcome, with the number of rounds;
   - outstanding issues or limitations;
   - worktree path, branch and PR link.
   Then stop.
5. Don't merge or remove the worktree unless I ask.
6. Update `state.md` to the final status.

## Roadmap

End every message that finishes a step or hands back to me (a question, a stop condition, the final report) with the roadmap, one step per line:

```
<slug>: resume with /orchestrate <slug>

✓ Identify
✓ Prepare
✓ Scope
‖ Design: plan awaiting approval
○ Implement
○ Validate
○ Review
○ Commit
```

`✓` done · `▸` in progress · `‖` waiting on me · `–` skipped (e.g. Prepare when continuing) · `○` to do. Add a short note after the current step, including the round on Review (`▸ Review: round 2`). Detail belongs in `state.md`.

When handing back to me, never mark the session as needing input: I may continue the change in another session, and I don't want it flagged in the agents view. Mark it as a result (where the change stands and the resume command), and send me a push notification when you need me.

## Seeding findings

When the session discovers a separate problem outside the current change's scope (another bug, a needed refactor), don't fix it inline and don't lose it.

1. Propose seeding it to me: the slug, type and a one-line summary. Do nothing without my approval.
2. On approval, create `~/.claude/work/<repo>/<slug>/` containing:
   - `state.md` with `Status: seeded`, a one-line goal, no worktree, and `Next: scope with the user`;
   - `findings.md`: what was observed, the evidence (file paths, commands, output), what is known versus unverified, and how it relates to the current change.
   If the project tracks bugs or work in an issue tracker, also open an issue in its style and link it from both files.
3. Don't create a worktree or branch. A later `/orchestrate` run picks the seed up (step 1) and creates them.
4. Mention the seed in the report for the current change.

## State files

Keep them short. They exist so a fresh session can resume cheaply, not as a log.

`state.md` is overwritten as work progresses:

```
# <slug>: <one-line goal>
Branch: <type>/<slug>  Worktree: <path>  Status: seeded | scoping | designing | implementing | in review | committed | PR #n
## Scope
## Done
## Next
## Open questions
```

`plan.md` holds the current implementation plan (step 4), overwritten when it's revised.

`decisions.md` is appended to, with one entry per significant decision:

```
- <decision>: <reason>. (approved by user | routine)
```
