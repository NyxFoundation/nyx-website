import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const run = (cmd, args, opts={}) => new Promise((resolve, reject) => {
  const p = spawn(cmd, args, { stdio: 'inherit', ...opts })
  p.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} -> ${code}`)))
})

try {
  await run('bash', ['scripts/killport.sh', '3000'])
  const dev = spawn('npm', ['run', 'dev'], { stdio: 'inherit' })
  // 待機: Next.js の起動猶予
  await sleep(4000)
  await run('bash', ['scripts/healthcheck.sh', 'http://localhost:3000', 'Nyx Foundation'])
  console.log('[dev_up] server healthy')
} catch (e) {
  console.error('[dev_up] failed:', e)
  process.exit(1)
}