const fs = require('fs');
const path = require('path');

const dir = '/home/meta/Downloads/datariot';
// Replacing old primary blue palette with new Logo Blue (#0EA5E9)
const regex = /(#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9)/gi;
const replacement = '#0EA5E9';
const includeExts = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html'];

function walk(currDir) {
    const files = fs.readdirSync(currDir);
    for (const f of files) {
        if (['node_modules', '.git', '.expo', 'dist', 'android', 'ios'].includes(f)) continue;
        const filepath = path.join(currDir, f);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath);
        } else if (stat.isFile() && includeExts.includes(path.extname(filepath))) {
            const content = fs.readFileSync(filepath, 'utf8');
            if (regex.test(content)) {
                fs.writeFileSync(filepath, content.replace(regex, replacement), 'utf8');
                console.log('Updated', filepath);
            }
        }
    }
}
walk(dir);
console.log('Replacement complete.');
