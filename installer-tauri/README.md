# ClawMate Setup Wizard

`installer-tauri/` contains the offline ClawMate setup wizard built with Tauri, React,
TypeScript, Vite, and Tailwind CSS.

## Development

```bash
pnpm --dir installer-tauri build
pnpm --dir installer-tauri tauri dev
cargo check --manifest-path installer-tauri/src-tauri/Cargo.toml
```

## Linux arm64 Builds

For `linux/arm64` (`aarch64`) installer output, run the build on a Linux host or Linux CI
runner:

```bash
pnpm run build:installer -- --os=linux --arch=arm64
```

The wrapper script now fails fast on non-Linux hosts because Tauri Linux bundles and the
embedded Electron payload are not validated as a macOS cross-build path in this repo.

## Payload Workflow

- `scripts/build-installer.mjs` builds an unpacked Electron app for a target OS/arch.
- The unpacked directory is zipped into `installer-tauri/src-tauri/resources/payload.zip`.
- Tauri bundles that payload into the final setup executable or app bundle.
- The committed placeholder `payload.zip` only exists so local `cargo check` and Tauri
  builds work before a real payload is generated.
