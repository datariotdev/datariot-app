const fs = require('fs');
const path = require('path');

const dir = '/home/meta/Downloads/datariot';
const regexList = [
    { regex: /(#0EA5E9|#0EA5E9|#0EA5E9)/gi, replacement: '#0EA5E9' },
    { regex: /background:\s*radial-gradient\(circle,\s*var\(--blue-2-glow\),\s*transparent\s*70%\);/g, replacement: 'background: radial-gradient(circle, var(--blue-1-glow), transparent 70%);' },
    { regex: /background:\s*radial-gradient\(circle,\s*var\(--blue-3-glow\),\s*transparent\s*70%\);/g, replacement: 'background: radial-gradient(circle, var(--blue-1-glow), transparent 70%);' },
    { regex: /rgba\(\s*0\s*,\s*212\s*,\s*255/g, replacement: 'rgba(14, 165, 233' },
    { regex: /rgba\(\s*0\s*,\s*136\s*,\s*255/g, replacement: 'rgba(14, 165, 233' },
    { regex: /rgba\(\s*0\s*,\s*140\s*,\s*255/g, replacement: 'rgba(14, 165, 233' },
    { regex: /rgba\(\s*0\s*,\s*102\s*,\s*255/g, replacement: 'rgba(14, 165, 233' },
    { regex: /rgba\(\s*0\s*,\s*60\s*,\s*200/g, replacement: 'rgba(14, 165, 233' },
    { regex: /rgba\(\s*0\s*,\s*85\s*,\s*255/g, replacement: 'rgba(14, 165, 233' }
];
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
console.log('Replacement complete.');
