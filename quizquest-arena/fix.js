const fs = require('fs');
const path = require('path');

function fix(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.vite') continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      fix(full);
    } else {
      if (full.match(/\.(ts|tsx|js|json|css|html|md)$/)) {
        let content = fs.readFileSync(full, 'utf8');
        let modified = false;
        if (content.includes('\
')) {
          content = content.replace(/\
/g, '
');
          modified = true;
        }
        if (content.includes('\"')) {
          content = content.replace(/\"/g, '"');
          modified = true;
        }
        if (content.includes('\	')) {
          content = content.replace(/\	/g, '	');
          modified = true;
        }
        if (modified) {
          fs.writeFileSync(full, content);
          console.log('Fixed:', full);
        }
      }
    }
  }
}
fix(__dirname);
console.log('Done fixing files.');
