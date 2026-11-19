---
name: review
description: Independent, read-only review of an implementation change by a separate Sonnet reviewer subagent, returning a findings-only report. Use when the user invokes /review, or when /orchestrate reaches its review step.
argument-hint: "[worktree path or branch; defaults to the current worktree]"
---

# /review

Target: $ARGUMENTS

This skill orchestrates the review. The review itself runs in the `reviewer` subagent (Sonnet, read-only), so the code is assessed independently of the context that wrote it. Neither this skill nor the reviewer modifies files, commits, or creates a worktree.

## 1. Identify the change

1. Use the worktree or branch given in the arguments. Otherwise use the current worktree.
2. Inspect the existing worktree directly. Never create another worktree for the same change.
3. Determine the base with `git merge-base HEAD <default-branch>`. The change under review is everything from the base to the working tree: the commit(s) plus any uncommitted changes.

## 2. Assemble the brief

The reviewer sees none of this conversation, so the brief must be self-contained. Include:

- **Worktree:** absolute path, branch, and base commit.
- **Requirements:** the original request and agreed scope.
  - From `/orchestrate`, use what it passed you.
  - Standalone, take them from the conversation, `~/.claude/work/<repo>/<worktree>/state.md`, the commit message, or the PR description.
  - If you still can't establish the requirements well enough to judge correctness, ask me before reviewing.
- **Design decisions:** from `decisions.md` or the conversation, including approved trade-offs, so they aren't reported as defects.
- **Validation already run:** commands and results, including known pre-existing failures.- **Applicable guidance:** the paths to read.
  - `~/.claude/rules/coding-principles.md`
  - `~/.claude/rules/coding-principles-rust.md` (for Rust)
  - `~/.claude/rules/git-workflow.md`
  - the project `CLAUDE.md`
  - the knowledge-base documents relevant to the changed area

Don't paste the diff. The reviewer inspects it itself, so it sees the real state.

## 3. Run the reviewer

Spawn the `reviewer` agent (Agent tool, `subagent_type: "reviewer"`) with the brief. Wait for its report.

## 4. Return the findings

- Relay the report unchanged: severity, location, description.
- Don't add fixes, soften or drop findings, or pad it with commentary. If there are no findings, say so explicitly.
- When invoked by `/orchestrate`, return the findings to it. It decides how to address them.
