const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace hex colors
    content = content.replace(/#ff0050/ig, '#40E0D0');
    content = content.replace(/#8b5cf6/ig, '#00CED1');
    content = content.replace(/#00f2ea/ig, '#20B2AA');
    
    // Replace specific dark mode classes that force white text to black text where appropriate
    content = content.replace(/text-white/g, 'text-black');
    content = content.replace(/text-black\/40/g, 'text-black/40');
    // For backgrounds
    content = content.replace(/bg-black(\/[0-9]+)?/g, (match) => {
       // Just make black transparent backgrounds into white transparent backgrounds for better contrast on turquoise
       return match.replace('black', 'white');
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated: ' + filePath);
    }
  }
});
