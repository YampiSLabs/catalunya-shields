import { readJson, writeJson } from './shared/fs.js';
import { searchCommonsFiles } from './shared/commons.js';
import { scoreCandidate } from './shared/candidates.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const municipalityFilter = args.find(a => a.startsWith('--municipality='))?.split('=')[1];
const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '5');

const municipalities = readJson<any[]>('data/municipalities.json');
const filtered = municipalityFilter 
  ? municipalities.filter(m => m.slug === municipalityFilter) 
  : (dryRun ? municipalities.slice(0, limit) : municipalities);

async function run() {
  for (const m of filtered) {
    console.log(`Searching for: ${m.name}`);
    const query = `Escut de ${m.name}.svg`;
    const files = await searchCommonsFiles(query);
    
    const candidates = files.map(f => scoreCandidate({ title: f.title, mime: 'image/svg+xml' }, m.name));
    candidates.sort((a, b) => b.score - a.score);
    
    console.log(`Found ${candidates.length} candidates for ${m.name}. Top: ${candidates[0]?.title} (Score: ${candidates[0]?.score})`);
    
    if (!dryRun && candidates.length > 0) {
      // TODO: Download logic
      writeJson(`data/commons-candidates/${m.slug}.json`, candidates);
    }
  }
}

run();
