# Catalunya Shields

A library of Catalan municipal shields. 

## Warning
This is not an official source. It uses Wikimedia Commons and the assets retain their original licenses.

## Usage
- `pnpm install`
- `pnpm normalize`
- `pnpm download:commons -- --municipality=barcelona --dry-run`
- `pnpm download:commons -- --municipality=barcelona`
- `pnpm optimize:shields`

## Structure
- `raw/svg`: Original files
- `assets/svg`: Optimized files
