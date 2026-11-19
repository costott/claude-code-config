const READ_ONLY = new Set([
  'status', 'diff', 'log', 'show', 'blame', 'rev-parse', 'merge-base',
  'ls-files', 'ls-tree', 'cat-file', 'grep', 'shortlog', 'describe', 'name-rev',
])
const BRANCH_LIST_MODE = new Set(['--list', '-a', '--all', '-r', '--remotes', '--merged', '--no-merged', '--contains', '--no-contains', '--points-at'])
const BRANCH_MUTATING = /^(-[dDmMcCfu]|--(delete|move|copy|force|set-upstream-to|unset-upstream|edit-description|track|no-track)\b)/

let input = ''
process.stdin.on('data', d => (input += d))
process.stdin.on('end', () => {
  let command
  try {
    command = JSON.parse(input).tool_input?.command ?? ''
  } catch {
    deny('could not parse hook input')
  }

  if (/[;&|<>`\n\r]|\$\(/.test(command)) deny('shell operators, redirection and substitution are not allowed')

  const args = command.trim().split(/\s+/)
  if (args[0] !== 'git') deny('only git commands are allowed')

  let i = 1
  while (args[i] === '-C' || args[i] === '--no-pager') i += args[i] === '-C' ? 2 : 1
  const sub = args[i]
  const rest = args.slice(i + 1)

  if (rest.some(a => /^(--output|--ext-diff|-O|--open-files-in-pager)/.test(a))) deny('output and external program options are not allowed')

  const allowed =
    READ_ONLY.has(sub) ||
    (sub === 'worktree' && rest[0] === 'list') ||
    (sub === 'branch' && (rest.length === 0 || rest.some(a => BRANCH_LIST_MODE.has(a))) && !rest.some(a => BRANCH_MUTATING.test(a)))

  if (!allowed) deny(`"git ${sub ?? ''}" with these arguments is not a read-only command`)
  process.exit(0)
})

function deny(reason) {
  process.stderr.write(`Reviewer is read-only: ${reason}. Use Read, Grep and Glob, or a read-only git command.`)
  process.exit(2)
}
