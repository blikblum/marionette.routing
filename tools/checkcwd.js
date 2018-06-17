const path = require('path')

const expectedDir = process.argv[2]
if (!expectedDir) {
  console.error('checkcwd: pass expected directory name as parameter')
  process.exit(1)
}

const actualDir = path.basename(process.cwd())
if (actualDir !== expectedDir) {
  console.error(`Current directory (${actualDir}) does not match expected (${expectedDir})`)
  process.exit(1)
}
