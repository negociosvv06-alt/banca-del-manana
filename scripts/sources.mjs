// Registro de fuentes: editar src/data/sources.json. type: 'rss' | 'api' | 'manual'.
import { readFileSync } from 'node:fs';
export const SOURCES = JSON.parse(readFileSync(new URL('../src/data/sources.json', import.meta.url), 'utf8'));
