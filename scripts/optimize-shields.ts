import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { optimize } from 'svgo';

const rawDir = 'raw/svg';
const assetsDir = 'assets/svg';

if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
}

const files = readdirSync(rawDir).filter(f => f.endsWith('.svg'));

for (const file of files) {
  console.log(`Optimizing: ${file}`);
  const content = readFileSync(join(rawDir, file), 'utf8');
  
  const result = optimize(content, {
    path: join(rawDir, file),
    multipass: true,
    plugins: [
      'preset-default',
      'removeDimensions', // This ensures it scales
      {
        name: 'addAttributesToSVGElement',
        params: { attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }] }
      }
    ]
  });
  
  writeFileSync(join(assetsDir, file), result.data);
  console.log(`Optimized ${file}`);
}
