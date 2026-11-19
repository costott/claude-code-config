---
name: implement
description: End-to-end implementation of one change in its own git worktree - scoping, design, implementation, validation, independent review and a single self-contained commit. Use when the user invokes /implement.
argument-hint: "[description of the change, or the worktree name to continue]"
disable-model-invocation: true
---

# /implement

Request: $ARGUMENTS

Follow `~/.claude/rules/coding-principles.md`, `~/.claude/rules/git-workflow.md` and (for Rust) `~/.claude/rules/coding-principles-rust.md` throughout. All modifications happen inside the change's worktree. Never edit the primary checkout.

## 1. Identify the change

1. Run `git worktree list` from the repository, and list `~/.claude/work/<repo>/`, where `<repo>` is the primary checkout's directory name.
2. Decide whether the request continues an existing change or starts a new, independent one.
   - **Continuing:** enter its worktree (`EnterWorktree` with `path`), then read its `state.md` and `decisions.md` before anything else.
   - **New:** go to step 2.
   - **Ambiguous** (for example, it could belong to an existing change or be separate): ask.
3. If the session is already inside a worktree belonging to a different change, don't use it. Start or enter the correct one.

## 2. Create the worktree (new changes only)

1. Check the primary checkout is clean and on the default branch. If it isn't, stop and report; don't stash or discard anything.
2. Run `git fetch`. If the default branch is behind its upstream, run `git pull --ff-only` in the primary checkout.
3. Run `EnterWorktree` with a descriptive kebab-case slug, then `git branch -m worktree-<slug> <type>/<slug>`.
4. Account for environment setup:
   - copy any ignored files the project needs via `.worktreeinclude` (propose adding one if it's missing and required);
   - run the setup steps from the project `CLAUDE.md`;
   - note that build output (e.g. `target/`) starts empty in a new worktree.
5. Create `~/.claude/work/<repo>/<slug>/state.md` and `decisions.md` (format below).

## 3. Understand and scope

1. Read the project `CLAUDE.md`, then the knowledge-base documents its index marks as relevant to the area being changed. Don't load the whole knowledge base.
2. Inspect the relevant code before making assumptions. Find existing functionality and patterns the change could reuse or extend.
3. Establish the intended outcome and the scope.
   - If the change isn't adequately scoped, help scope it first.
   - If design decisions, ambiguities or missing requirements are unresolved, ask, batching the questions.
   - Don't ask about anything already clear or discoverable from the repository.
4. Record the agreed scope in `state.md`.

## 4. Design

1. Settle a clear enough design before writing code: the simplest mechanism, existing abstractions, and consistency with the surrounding code.
2. Check the design for unnecessary complexity, duplication of existing functionality, and its effect on the public API surface.
3. For larger changes, present a short implementation plan and get agreement before proceeding.
4. Record each significant decision in `decisions.md`, with its reason and whether I approved it or it was a routine choice.

## 5. Implement

1. Work autonomously once scope and design are clear. Don't ask me to micromanage individual steps.
2. Keep the change focused: no unrelated refactoring or opportunistic edits.
3. Add or update tests that pin the intended behaviour.
4. Keep documentation in sync, in the same change:
   - Update any knowledge-base document whose `sources` you changed, and its `verified` commit, following the project `CLAUDE.md`'s sync rule.
   - Update the README for important user-facing changes.
   - Bump crate versions according to semver when the public API changes.
5. Update `state.md` at meaningful milestones, so another session could resume from it.

## 6. Validate

1. Run the project's validation commands from its `CLAUDE.md`. Typically these are formatting, clippy on changed code, and tests.
2. Compare the results against the documented baseline, so pre-existing failures are distinguished from new ones.
3. Confirm the change actually works. Run the relevant example or scenario where tests can't show it.
4. For performance work, take before and after measurements.
5. Never claim success without evidence.

## 7. Independent review

1. Invoke the `review` skill (Skill tool, `review`). Pass it:
   - the original request and agreed scope;
   - the design decisions from `decisions.md`;
   - any implementation context the reviewer needs;
   - the validation results;
   - the worktree path.
2. The reviewer only reports findings. Making changes stays your responsibility.
3. Address each finding:
   - fix it; or
   - if you disagree, record why in `decisions.md`; or
   - raise it with me if it involves a material decision.
4. After substantive fixes, revalidate and review again. Stop when no findings of high or medium severity remain unaddressed.

## 8. Commit and report

1. Commit in the worktree as a single self-contained commit. If this change already has a commit, amend it.
   - Stage explicit paths only.
   - Check `git status` and `git diff --staged` for unrelated changes.
   - Use a concise British English message that describes the change.
   - No AI attribution of any kind.
2. Re-run validation if anything changed after the last run.
3. Report concisely:
   - what changed;
   - validation results;
   - review outcome;
   - outstanding issues or limitations;
   - worktree path and branch.
   Then stop.
4. Don't push, open a PR, merge or remove the worktree unless I ask. Follow the lifecycle in `git-workflow.md`.
5. Update `state.md` to the final status.

## State files

Keep both short. They exist so a fresh session can resume cheaply, not as a log.

`state.md` is overwritten as work progresses:

```
# <slug>: <one-line goal>
Branch: <type>/<slug>  Worktree: <path>  Status: scoping | designing | implementing | in review | committed | PR #n
## Scope
## Done
## Next
## Open questions
```

`decisions.md` is appended to, with one entry per significant decision:

```
- <decision>: <reason>. (approved by user | routine)
```
