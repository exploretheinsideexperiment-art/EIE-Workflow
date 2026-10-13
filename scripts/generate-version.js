import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

let commit = 'latest';
try {
  commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // fallback if git not available
}

const buildTimestamp = Date.now();
const buildId = `bld_${buildTimestamp}_${commit}`;

const versionData = {
  version: '1.0.0',
  buildTime: buildTimestamp,
  builtAt: new Date(buildTimestamp).toISOString(),
  buildId,
  commit,
};

fs.writeFileSync(
  path.join(publicDir, 'version.json'),
  JSON.stringify(versionData, null, 2)
);

console.log(`[generate-version] Generated version.json: ${buildId} at ${new Date(buildTimestamp).toISOString()}`);
