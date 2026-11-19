const fs = require('fs')
const os = require('os')
const path = require('path')

let input = ''
process.stdin.on('data', d => (input += d))
process.stdin.on('end', () => {
  try {
    const { cwd = '', session_title: current } = JSON.parse(input)
    if (current) return
    const slug = cwd.replace(/\\/g, '/').match(/\/\.claude\/worktrees\/([^/]+)/)?.[1]
    if (!slug) return

    const work = path.join(os.homedir(), '.claude', 'work')
    for (const repo of fs.readdirSync(work)) {
      const file = path.join(work, repo, slug, 'title')
      if (!fs.existsSync(file)) continue
      const title = fs.readFileSync(file, 'utf8').trim()
      if (title) {
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: { hookEventName: 'UserPromptSubmit', sessionTitle: title },
        }))
      }
      return
    }
  } catch {}
})
