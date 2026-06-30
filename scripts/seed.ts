/**
 * THE ARK — Master Seed Script
 * Runs all seed operations in correct order.
 * Isaac Brandon Burdette, Sole Inventor — Atlas Genesis Matrix LLC
 *
 * Usage: npm run seed
 */

import { execSync } from 'child_process'

const steps = [
  { label: 'Seed demo data (portals, agents, skills)',  cmd: 'tsx scripts/seed-demo.ts' },
  { label: 'Seed agent tasks (self-build queue)',       cmd: 'tsx scripts/seed-agent-tasks.ts' },
]

console.log('\n🌱  THE ARK — Master Seed\n')

for (const step of steps) {
  console.log(`▶  ${step.label}`)
  try {
    execSync(step.cmd, { stdio: 'inherit' })
    console.log(`✅  Done\n`)
  } catch (err) {
    console.error(`❌  Failed: ${step.cmd}`)
    console.error(err)
    process.exit(1)
  }
}

console.log('🎉  All seed steps complete.')
