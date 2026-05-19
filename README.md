# Catalunya Shields 🛡️

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Language](https://img.shields.io/badge/language-TypeScript-blue)

A curated collection of optimized SVG municipal shields from Catalonia.

## Tags

#Catalunya #MunicipalShields #SVG #OpenData #Frontend

## Purpose

This repository provides automated scripts to normalize municipal names, download authentic shields from Wikimedia Commons, and optimize them for use in web/frontend applications.

## Disclaimer

This is **not** an official source. This repository automates the retrieval of assets from Wikimedia Commons. Users are responsible for verifying licenses and complying with attribution requirements for each asset used.

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
2. **Setup Asset Pipeline:**

   ```bash
   # Normalize names and data structure
   pnpm normalize

   # Download missing shields (use dry-run first)
   pnpm download:commons -- --dry-run
   pnpm download:commons

   # Optimize assets
   pnpm optimize:shields
   ```

## Structure

- `data/`: Municipal metadata
- `raw/svg/`: Original SVG files
- `assets/svg/`: Optimized, ready-to-use SVG files
- `docs/`: Project documentation and status tracking

## License

Licensed under the [MIT License](LICENSE).
Please ensure you comply with the licensing terms of the individual assets retrieved from Wikimedia Commons.
