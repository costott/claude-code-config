# claude-code-config

My personal development environment for [Claude Code](https://claude.com/claude-code). It aims for good engineering outcomes on minimal tokens: little context loaded by default, an explicit workflow for each change, and autonomous independent review rounds.

## Principles

- **One canonical home per kind of information.** Communication preferences, coding principles, workflows, project knowledge and memory each live in exactly one place and aren't duplicated.
- **Load selectively.** Only `CLAUDE.md` and the general rules load every session. Rust rules load only when Rust files are involved. Project knowledge bases are indexed, and only the relevant documents get read.
- **Stop and ask rather than guess.** Material uncertainty is raised explicitly instead of being buried in confident output.
- **Learn from corrections.** When a correction reveals a general lesson, the lesson is written into the canonical file it belongs to. The individual incident isn't recorded.
- **Independent review rounds.** Changes are reviewed by a separate, cheaper, read-only model, round after round, until the remaining fixes are trivial and no finding is disputed. It reports findings only and never fixes anything, so its output stays small and the orchestrating session stays responsible for the code. The loop stops and reports to me, rather than burning tokens, when two reviews contradict each other, a finding is re-raised after being fixed or disputed, a finding challenges a decision I made or approved, or one needs a material decision I haven't made.

## Layout

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Global instructions: communication, uncertainty, where things live, memory policy, learning from corrections |
| `rules/coding-principles.md` | Language-agnostic coding principles (always loaded) |
| `rules/coding-principles-rust.md` | Rust principles, loaded only for `*.rs` and `Cargo.toml` (`paths:` frontmatter) |
| `rules/git-workflow.md` | Worktree-per-change policy, commit rules, change lifecycle |
| `skills/orchestrate/` | `/orchestrate`: scope, design, implement, validate, run review rounds and commit one change in its own worktree; seeds findings for separate changes |
| `skills/review/` | `/review`: assembles a self-contained brief and hands it to the reviewer agent |
| `agents/reviewer.md` | Reviewer (Sonnet, high effort; Opus on request) with `Read`/`Grep`/`Glob`/`Bash`; returns a findings-only report |
| `hooks/readonly-git.js` | `PreToolUse` hook that restricts the reviewer's Bash to read-only git commands |
| `hooks/protect-default-branch.js` | Global `PreToolUse` hook that blocks `git push` to `main`, `master` or the remote's default branch (except in `~/.claude`), and `gh pr merge` everywhere |
| `hooks/session-title.js` | `UserPromptSubmit` hook, registered in the `orchestrate` skill's frontmatter, that names the session `REPO \| change` from the change's `title` file |
| `statusline.js` | Status line showing prompt-cache warmth and context usage in tokens |

## Workflow

1. **`/orchestrate <change>`** creates a native worktree from the default branch and renames its branch to `<type>/<slug>`. It reads the project's knowledge-base index, scopes and designs the change (asking about anything unresolved), then implements and validates it. It also writes the session title (`REPO | change`) to the change's state directory.
2. **`/review`**, run in rounds by `/orchestrate`, gives the reviewer the requirements, design decisions, validation results and the worktree path. The reviewer inspects the real diff itself, read-only.
3. Findings are addressed and the change is reviewed again while fixes are substantive or findings disputed; trivial fixes need no further round. A contradiction between reviews, a re-raised finding, a finding against a decision I made or approved, or one needing a material decision I haven't made, stops the loop and goes to me. The change is committed as **one self-contained commit**, amended on later iterations, and nothing carries AI attribution.
4. Once the change passes validation and review with nothing waiting on me, it is pushed and opened as a GitHub PR. Later iterations amend the commit and update the PR. Merging and cleaning up the worktree happen only on explicit request.

If the session finds a separate problem, it proposes seeding it. On my approval it writes `findings.md` and a `Status: seeded` `state.md` into a new state directory, with no worktree, so a later `/orchestrate` run can pick it up.

Each change keeps short `state.md` and `decisions.md` files (plus a `title` file, and `findings.md` for seeds) in `~/.claude/work/<repo>/<worktree>/`. A fresh session can then resume from a couple of short files instead of re-reading a transcript.

## Installation

This repository is `~/.claude` itself. Its `.gitignore` ignores everything except the files above, so credentials, history, transcripts and per-change state can never be committed.

```sh
git clone <this repo> ~/.claude   # or, into an existing ~/.claude: git init, add the remote, git fetch, git checkout -f main
```

`settings.json` is machine-specific, so it isn't tracked. The workflow relies on these keys. The `PreToolUse` hook must be global so it guards every session. The `UserPromptSubmit` entry is a fallback: `orchestrate` registers the session-title hook in its own frontmatter, and this is only needed if that doesn't fire on your build, since a skill-scoped hook may not run on later prompts:

```json
{
  "attribution": { "commit": "", "pr": "", "sessionUrl": false },
  "worktree": { "baseRef": "head" },
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|PowerShell", "hooks": [{ "type": "command", "command": "node \"$HOME/.claude/hooks/protect-default-branch.js\"" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node \"$HOME/.claude/hooks/session-title.js\"" }] }
    ]
  },
  "statusLine": { "type": "command", "command": "node \"$HOME/.claude/statusline.js\"" }
}
```

`CLAUDE.md` lists my own projects. Replace that section with yours.

## Roadmap

- **Parallel changes.** Light orchestration for running several independent changes at once, with one worktree and session each and a summary of their states. The constraint is that it must stay cheap. A heavyweight orchestrator would defeat the purpose of this setup.
- **Clean-up skill.** Turn the "clean up after merge" step into a skill, rather than leaving it as a rule.
- **Staleness checks.** A small script that lists knowledge-base documents whose `sources` changed after their `verified` commit.
