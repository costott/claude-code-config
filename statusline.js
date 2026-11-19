// Status line: live prompt-cache warmth + context fill, from the JSON Claude Code passes on stdin.
let input = ''
process.stdin.on('data', d => (input += d))
process.stdin.on('end', () => {
  let j = {}
  try { j = JSON.parse(input) } catch {}

  // Cache: prompt_cache.expires_at is epoch seconds; ttl is "5m" or "1h".
  const pc = j.prompt_cache
  let warmth = '❄️ cold'
  if (pc && pc.caching_observed === false) {
    warmth = '❄️ no cache'
  } else if (pc && pc.warm && typeof pc.expires_at === 'number') {
    const left = pc.expires_at * 1000 - Date.now()
    if (left > 0) {
      const m = Math.floor(left / 60_000)
      warmth = `🔥 ${m >= 1 ? m + 'm' : Math.floor(left / 1000) + 's'}`
    }
  }

  // Context: live tokens from the most recent response.
  const cw = j.context_window || {}
  const size = cw.context_window_size
  const u = cw.current_usage
  let used = cw.total_input_tokens
  if (!used && u) used = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0)

  let ctx = ''
  if (typeof used === 'number' && size) {
    const f = Math.min(1, used / size)
    const W = 10
    const filled = Math.round(f * W)
    const color = f < 0.5 ? 32 : f < 0.8 ? 33 : 31 // green, yellow, red
    const tok = n => (n >= 1e6 ? +(n / 1e6).toFixed(1) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n))
    ctx = ` · \x1b[${color}m${'▰'.repeat(filled)}\x1b[90m${'▱'.repeat(W - filled)}\x1b[0m ${tok(used)}/${tok(size)}`
  }
  process.stdout.write(warmth + ctx)
})
