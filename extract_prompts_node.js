const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const outputFile = path.join(__dirname, 'all_user_prompts.txt');

// Get all cursor_*.md files
const files = fs.readdirSync(docsDir)
  .filter(f => f.startsWith('cursor_') && f.endsWith('.md'))
  .sort()
  .map(f => path.join(docsDir, f));

let allPrompts = [];

files.forEach(filepath => {
  const filename = path.basename(filepath);
  console.log(`Processing ${filename}...`);
  
  const content = fs.readFileSync(filepath, 'utf8');
  
  // Find all User sections - match **User** followed by newlines, then capture until **Cursor** or ---
  const pattern = /\*\*User\*\*\s*\n\s*\n(.*?)(?=\n\*\*Cursor\*\*|\n---\n)/gs;
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    const prompt = match[1].trim();
    if (prompt) {
      allPrompts.push(`=== ${filename} ===\n${prompt}\n\n`);
    }
  }
});

// Write to file
const outputContent = allPrompts.join('\n');
fs.writeFileSync(outputFile, outputContent, 'utf8');

console.log(`\n✅ Extracted ${allPrompts.length} prompts to ${outputFile}`);
console.log(`Total length: ${outputContent.length} characters`);

