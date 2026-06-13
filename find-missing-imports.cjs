const fs = require('fs');
const path = require('path');

function findFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = findFiles('c:/Users/Rishi/Desktop/Zappy/src');
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('useEffect(')) {
        if (!content.match(/import\s*\{[^}]*useEffect[^}]*\}\s*from\s*['"]react['"]/)) {
            console.log(file);
        }
    }
});
