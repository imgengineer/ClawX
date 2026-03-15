#!/usr/bin/env zx

import 'zx/globals';
import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const VALID_OSES = ['win', 'mac', 'linux'];
const VALID_ARCHES = ['x64', 'arm64'];

const targetOs = argv.os || 'win';
const targetArch = argv.arch || 'x64';
const rootDir = process.cwd();
const installerDir = path.join(rootDir, 'installer-tauri');
const tauriResourcesDir = path.join(installerDir, 'src-tauri', 'resources');
const payloadZip = path.join(tauriResourcesDir, 'payload.zip');

if (argv.help || argv.h) {
  console.log(`
Usage:
  pnpm run build:installer -- --os=win|mac|linux --arch=x64|arm64

Examples:
  pnpm run build:installer -- --os=win --arch=x64
  pnpm run build:installer -- --os=mac --arch=arm64
`);
  process.exit(0);
}

if (!VALID_OSES.includes(targetOs)) {
  throw new Error(`Invalid --os value "${targetOs}". Expected one of: ${VALID_OSES.join(', ')}`);
}

if (!VALID_ARCHES.includes(targetArch)) {
  throw new Error(`Invalid --arch value "${targetArch}". Expected one of: ${VALID_ARCHES.join(', ')}`);
}

if (targetOs === 'linux' && process.platform !== 'linux') {
  throw new Error(
    `Linux installer builds must run on a Linux host or Linux CI runner. Current host is ${process.platform}, target is linux/${targetArch}.`,
  );
}

const builderOsFlag = `--${targetOs === 'win' ? 'win' : targetOs === 'mac' ? 'mac' : 'linux'}`;
const builderArchFlag = `--${targetArch}`;

const tauriTargetMap = {
  win: {
    x64: 'x86_64-pc-windows-msvc',
    arm64: 'aarch64-pc-windows-msvc',
  },
  linux: {
    x64: 'x86_64-unknown-linux-gnu',
    arm64: 'aarch64-unknown-linux-gnu',
  },
  mac: {
    x64: 'x86_64-apple-darwin',
    arm64: 'aarch64-apple-darwin',
  },
};

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findElectronPayloadDir() {
  const releaseDir = path.join(rootDir, 'release');

  if (targetOs === 'win') {
    const candidates = targetArch === 'arm64'
      ? ['win-arm64-unpacked', 'win-unpacked']
      : ['win-unpacked', 'win-arm64-unpacked'];
    for (const candidate of candidates) {
      const fullPath = path.join(releaseDir, candidate);
      if (await exists(fullPath)) {
        return fullPath;
      }
    }
  }

  if (targetOs === 'linux') {
    const candidates = targetArch === 'arm64'
      ? ['linux-arm64-unpacked', 'linux-unpacked']
      : ['linux-unpacked', 'linux-arm64-unpacked'];
    for (const candidate of candidates) {
      const fullPath = path.join(releaseDir, candidate);
      if (await exists(fullPath)) {
        return fullPath;
      }
    }
  }

  if (targetOs === 'mac') {
    const candidates = targetArch === 'arm64'
      ? ['mac-arm64', 'mac']
      : ['mac', 'mac-arm64'];
    for (const candidate of candidates) {
      const appBundle = path.join(releaseDir, candidate, 'ClawMate.app');
      if (await exists(appBundle)) {
        return appBundle;
      }
    }
  }

  throw new Error(`Could not locate the unpacked Electron output under ${releaseDir}`);
}

async function zipDirectoryContents(sourceDir, destinationZip) {
  await fs.mkdir(path.dirname(destinationZip), { recursive: true });
  await fs.rm(destinationZip, { force: true });

  await new Promise((resolve, reject) => {
    const output = createWriteStream(destinationZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function resolveTauriCli() {
  const tauriCliName = process.platform === 'win32' ? 'tauri.cmd' : 'tauri';
  const tauriCliPath = path.join(installerDir, 'node_modules', '.bin', tauriCliName);

  if (await exists(tauriCliPath)) {
    return tauriCliPath;
  }

  throw new Error(
    `Could not find the installer-local Tauri CLI at ${tauriCliPath}. Run "pnpm install --dir installer-tauri" before building the offline installer.`,
  );
}

console.log(chalk.blue(`[1/4] Starting installer build: os=${targetOs}, arch=${targetArch}`));

console.log(chalk.yellow(`[2/4] Building unpacked Electron app...`));
await $`pnpm run build:vite`;
await $`pnpm exec zx scripts/bundle-openclaw.mjs`;
await $`pnpm exec zx scripts/bundle-openclaw-plugins.mjs`;
await $`pnpm exec zx scripts/bundle-preinstalled-skills.mjs`;
await $`pnpm exec electron-builder --dir ${builderOsFlag} ${builderArchFlag}`;

const unpackedDir = await findElectronPayloadDir();
console.log(chalk.green(`Electron payload ready at ${unpackedDir}`));

console.log(chalk.yellow(`[3/4] Creating offline payload archive...`));
await zipDirectoryContents(unpackedDir, payloadZip);
const payloadStat = await fs.stat(payloadZip);
console.log(chalk.green(`Payload archive written to ${payloadZip} (${Math.round(payloadStat.size / 1024 / 1024)} MB)`));

console.log(chalk.yellow(`[4/4] Building Tauri setup wizard...`));
const tauriTarget = tauriTargetMap[targetOs][targetArch];
const tauriCliPath = await resolveTauriCli();

await $`rustup target add ${tauriTarget}`;
await $`${tauriCliPath} build --target ${tauriTarget}`;

console.log(chalk.green(`\nInstaller build completed successfully.`));
console.log(`Bundle output: ${path.join(installerDir, 'src-tauri', 'target', tauriTarget, 'release', 'bundle')}`);
