// Where things are, resolved from this file so the kit works wherever the repo is cloned.
//   KIT       showcase/kit (this kit)
//   REPO      the AIDE-AGENCY-2026-DESIGN repo root (two levels up), or $AGENCY_DESIGN
//   BRAND     <REPO>/brand, or $AGENCY_BRAND
//   FILMS     where film folders are made: $FILMS_DIR, else <REPO>/../showcase (outside git: frames and masters are large)
//   INVENTORY the Agency 2026 project inventory (optional; slot mode only): $AGENCY_INVENTORY, else the SHELL default
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const REPO = path.resolve(process.env.AGENCY_DESIGN || path.join(KIT, '../..'));
export const BRAND = path.resolve(process.env.AGENCY_BRAND || path.join(REPO, 'brand'));
export const FILMS = path.resolve(process.env.FILMS_DIR || path.join(REPO, '..', 'showcase'));
export const INVENTORY = process.env.AGENCY_INVENTORY || '/mnt/data/projects/agency-2026/project-inventory/inventory.json';
export const repoOk = () => fs.existsSync(path.join(REPO, 'brand/tokens/tokens.json'));
