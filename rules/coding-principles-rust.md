---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---

# Rust coding principles

Extends `~/.claude/rules/coding-principles.md`. Idiomatic Rust takes precedence over habits in existing code.

- Follow idiomatic Rust and the Rust API Guidelines (https://rust-lang.github.io/api-guidelines/), e.g. no `get_` prefix on getters, conventional conversion names (`as_`, `to_`, `into_`), standard trait implementations where they make sense.
- Code is formatted with `rustfmt`. New and changed code is `clippy`-clean; don't fix unrelated existing warnings in the same change.
- Group imports in this order, separated by blank lines: `std`/`core`/`alloc`, external crates, then `crate`/`super`. `rustfmt` sorts within groups but doesn't enforce the grouping on stable (`group_imports` is nightly-only).
- Paths to the crate's own items start from `crate::`, re-exports in the crate root included; never a bare module path or `self::`. `super::` appears only as `use super::*;` in a child `mod tests`. Code compiled as a separate crate (examples, benches, doctests, proc-macro output) names the crate, as a user would.
- One `use` per module, with braces only for several items from that module (rustfmt's `imports_granularity = "Module"`, nightly-only).
- Order a module's items:
  1. Imports, then `pub use` re-exports.
  2. `mod` declarations; `cfg`-gated ones (e.g. `#[cfg(feature = "internals")] pub mod internals`) after the ungated ones.
  3. Module-wide constants and statics.
  4. Types and free functions, public entry points first. Each type is followed by its impls, inherent then trait. A private helper (type or function) goes directly after the item that uses it, or after the last of several users. In a binary `fn main` comes first; in a Criterion bench the bench functions come first and `criterion_group!`/`criterion_main!` last.
  5. `#[cfg(test)] mod tests`, with shared fixtures and helpers before the tests.
- Order an impl's items:
  1. Associated constants and types.
  2. Constructors.
  3. Methods, widest visibility first (`pub`, `pub(crate)`, private). A private helper is placed by its user, not its visibility: directly after the method that uses it, or after the last of several, even within the `pub` group.
- Items exposed only through a feature form their own group after the ungated items. Re-exports go in a gated module, such as `#[cfg(feature = "internals")] pub mod internals`. Methods go in a separate impl block directly after the type's ungated inherent impl, headed by a doc comment saying what it covers; the feature's purpose is documented once, where it is defined. A `cfg` gate goes on the block once. Lint expectations such as `expect(dead_code)` stay on each item, because one on the block is satisfied while any item in it still triggers the lint.
- Alternative `cfg` variants of one item (per platform or per feature) sit next to each other.
- A function that doesn't need its receiver is a free function, not a method. Split a type's inherent impl into several only when it has distinct concerns, each block headed by a doc comment saying what it covers.
- The Rust Style Guide fixes only the order of `use` and `mod`; the rest is convention, checked in review, because no linter enforces it without forcing alphabetical order.
- Every `unsafe` block has a `// SAFETY:` comment stating why it is sound, and every `unsafe fn` has a `# Safety` section stating the caller's obligations.
- Default to the narrowest visibility (`pub(crate)`, private). Make something `pub` only when users of the API need it.
- Public items get rustdoc: summary line, behaviour, `# Errors` / `# Panics` / `# Safety` sections where relevant, and examples that compile and run as doctests (`ignore` only when unavoidable).
- Library code returns typed errors for failures a correct program can still meet (I/O, malformed input, the environment). Panic only on bugs: a violated internal invariant, with an `expect` message stating it, or a broken documented precondition, checked at the API boundary and documented under `# Panics`.
- Bump crate versions according to Cargo's semver conventions.
