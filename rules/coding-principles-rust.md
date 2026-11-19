---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---

# Rust coding principles

Extends `~/.claude/rules/coding-principles.md`. Idiomatic Rust takes precedence over habits in existing code.

- Follow idiomatic Rust and the Rust API Guidelines (https://rust-lang.github.io/api-guidelines/), e.g. no `get_` prefix on getters, conventional conversion names (`as_`, `to_`, `into_`), standard trait implementations where they make sense.
- Code is formatted with `rustfmt`. New and changed code is `clippy`-clean; don't fix unrelated existing warnings in the same change.
- Every `unsafe` block has a `// SAFETY:` comment stating why it is sound, and every `unsafe fn` has a `# Safety` section stating the caller's obligations.
- Default to the narrowest visibility (`pub(crate)`, private). Make something `pub` only when users of the API need it.
- Public items get rustdoc: summary line, behaviour, `# Errors` / `# Panics` / `# Safety` sections where relevant, and examples that compile and run as doctests (`ignore` only when unavoidable).
- Library code returns typed errors for failures a caller can cause or handle. Panic only on violated internal invariants, with an `expect` message stating the invariant.
- Bump crate versions according to Cargo's semver conventions.
