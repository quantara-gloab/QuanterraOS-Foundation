const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const configPath = path.join(process.env.USERPROFILE, '.fly', 'config.yml');
const content = fs.readFileSync(configPath, 'utf8');
const match = content.match(/access_token:\s*([^\r\n]+)/);

if (!match) {
  console.error('No access_token found in ~/.fly/config.yml');
  process.exit(1);
}

const token = match[1].trim();
const flyBin = path.join(process.env.USERPROFILE, '.fly', 'bin', 'flyctl.exe');

console.log('Initiating Fly.io production deployment for quanterraos.com...');

const child = spawn(flyBin, ['deploy', '--remote-only', '--yes'], {
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    FLY_ACCESS_TOKEN: token,
    FLY_API_TOKEN: token
  },
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`flyctl deploy process exited with code ${code}`);
  process.exit(code || 0);
});
