import { readJson, writeJson } from './shared/fs.js';

const municipalities = readJson<any[]>('data/municipalities.json');
// TODO: Implement download logic
console.log(`Checking ${municipalities.length} municipalities.`);
