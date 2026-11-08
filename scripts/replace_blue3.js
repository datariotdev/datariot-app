const fs = require('fs');
const path = require('path');

const dir = '/home/meta/Downloads/datariot';
const regexList = [
    { regex: /(#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9|#0EA5E9)/gi, replacement: '#0EA5E9' },
    // Also handle some specific RGBA variants if they exist for these colors
];
const includeExts = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json'];

function walk(currDir) {
    const files = fs.readdirSync(currDir);
    for (const f of files) {
        if (['node_modules', '.git', '.expo', 'dist', 'android', 'ios', 'package-lock.json'].includes(f)) continue;
        const filepath = path.join(currDir, f);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath);
        } else if (stat.isFile() && includeExts.includes(path.extname(filepath))) {
            let content = fs.readFileSync(filepath, 'utf8');
            let modified = false;
            for (const { regex, replacement } of regexList) {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(filepath, content, 'utf8');
                console.log('Updated', filepath);
            }
        }
    }
}
walk(dir);
console.log('Final replacement complete.');
