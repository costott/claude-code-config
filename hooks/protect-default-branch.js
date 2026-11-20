const { execFileSync } = require('child_process')
const os = require('os')
const path = require('path')

const CONFIG_REPO_GIT_DIR = normalise(path.join(os.homedir(), '.claude', '.git'))
const GIT_OPTIONS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace'])
const PUSH_OPTIONS_WITH_VALUE = new Set(['--repo', '-o', '--push-option', '--receive-pack', '--exec'])
const PUSH_ALL_BRANCHES = new Set(['--all', '--branches', '--mirror'])
const COMMAND_PREFIXES = new Set(['&', '(', '{', 'then', 'else', 'do', 'time', 'command', 'exec', 'env', 'sudo'])

let input = ''
process.stdin.on('data', d => (input += d))
process.stdin.on('end', () => {
  let command, cwd
  try {
    const parsed = JSON.parse(input)
    command = parsed.tool_input?.command ?? ''
    cwd = parsed.cwd ?? process.cwd()
  } catch {
    deny('could not parse hook input')
  }

  for (const segment of splitCommands(command)) {
    const args = stripPrefixes(segment)
    if (args.length === 0) continue
    const program = args[0].replace(/\.exe$/i, '').toLowerCase()
    if (program === 'cd' || program === 'set-location' || program === 'pushd') {
      const target = args.slice(1).find(a => !a.startsWith('-'))
      if (target) cwd = resolveDir(cwd, target)
    } else if (program === 'gh' && args[1] === 'pr' && args[2] === 'merge') {
      deny('merging a PR is reserved for the user')
    } else if (program === 'git') {
      checkPush(args, cwd)
    }
  }
  process.exit(0)
})

function checkPush(args, cwd) {
  let i = 1
  let dir = cwd
  while (i < args.length && args[i].startsWith('-')) {
    if (args[i] === '-C') dir = resolveDir(dir, args[i + 1] ?? '')
    i += GIT_OPTIONS_WITH_VALUE.has(args[i]) ? 2 : 1
  }
  if (args[i] !== 'push') return

  const positional = []
  let tagsOnly = false
  for (let j = i + 1; j < args.length; j++) {
    const arg = args[j]
    if (PUSH_OPTIONS_WITH_VALUE.has(arg)) j++
    else if (PUSH_ALL_BRANCHES.has(arg)) return refuse(dir, 'pushing every branch includes the default branch')
    else if (arg === '--tags') tagsOnly = true
    else if (!arg.startsWith('-')) positional.push(arg)
  }

  const [remote = 'origin', ...refspecs] = positional
  if (tagsOnly && refspecs.length === 0) return

  if (git(dir, 'rev-parse', '--git-dir') === null) {
    return refuse(dir, `could not resolve the repository at "${dir}" to check the push target`)
  }

  const protectedBranches = new Set(['main', 'master'])
  const remoteHead = git(dir, 'symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`)
  if (remoteHead) protectedBranches.add(remoteHead.slice(remote.length + 1))

  const current = git(dir, 'symbolic-ref', '--short', 'HEAD') ?? ''
  const targets = refspecs.length === 0 ? implicitTargets(dir, current) : refspecs.map(spec => destination(spec, current))
  const hit = targets.find(t => t === '' || t.includes('*') || protectedBranches.has(t))
  if (hit !== undefined) refuse(dir, hit === '' || hit.includes('*') ? `refspec "${hit || ':'}" can push the default branch` : `"${hit}" is a default branch`)
}

function implicitTargets(dir, current) {
  const upstream = git(dir, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}')
  const upstreamBranch = upstream?.slice(upstream.indexOf('/') + 1)
  return [current, upstreamBranch].filter(Boolean)
}

function destination(refspec, current) {
  const spec = refspec.replace(/^\+/, '')
  if (spec === ':') return ''
  const colon = spec.indexOf(':')
  let dest = colon === -1 ? spec : spec.slice(colon + 1) || spec.slice(0, colon)
  if (dest === 'HEAD' || dest === '@') dest = current || 'HEAD'
  return dest.replace(/^refs\/heads\//, '')
}

// ~/.claude's own workflow commits and pushes `main` directly, from its checkout or any of its worktrees.
function refuse(dir, reason) {
  const commonDir = git(dir, 'rev-parse', '--path-format=absolute', '--git-common-dir')
  if (commonDir && normalise(commonDir) === CONFIG_REPO_GIT_DIR) return
  deny(`${reason}. Push the change's own branch and open a PR instead`)
}

function git(dir, ...args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

// Splits on shell separators outside quotes, so multi-line quoted arguments such as PR bodies stay one command.
function splitCommands(command) {
  const segments = []
  let current = ''
  let quote = null
  for (const ch of command) {
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (';&|\n\r'.includes(ch)) {
      segments.push(current)
      current = ''
      continue
    }
    current += ch
  }
  segments.push(current)
  return segments
}

function stripPrefixes(segment) {
  const args = (segment.replace(/^[\s({]+|[\s)}]+$/g, '').match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map(t => t.replace(/^(["'])([\s\S]*)\1$/, '$2'))
  while (args.length && (COMMAND_PREFIXES.has(args[0]) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(args[0]))) args.shift()
  return args
}

function resolveDir(base, target) {
  let dir = target.replace(/^(~|\$HOME|\$env:USERPROFILE)(?=$|[\\/])/i, os.homedir())
  if (process.platform === 'win32') dir = dir.replace(/^\/([a-z])(?=$|\/)/i, '$1:/')
  return path.resolve(base, dir)
}

function normalise(p) {
  const resolved = path.resolve(p)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

function deny(reason) {
  process.stderr.write(`Blocked: ${reason}.`)
  process.exit(2)
}
