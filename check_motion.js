import fs from "fs";
import path from "path";

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walk(dirFile, filelist);
    } else if (dirFile.endsWith(".tsx") || dirFile.endsWith(".ts")) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walk("./src");
const badFiles = [];

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("<motion.") && !content.includes("motion") /* if it doesnt import it, the word motion would only appear as <motion. */) {
    // Actually a better check is matching `import { .*motion.* } from "framer-motion"`
  }
  
  if (content.includes("<motion.")) {
    const importMatch = content.match(/import\s+{.*?\bmotion\b.*?}\s+from\s+["']framer-motion["']/);
    const defaultImportMatch = content.match(/import\s+\bmotion\b\s+from\s+["']framer-motion["']/);
    
    if (!importMatch && !defaultImportMatch) {
      badFiles.push(file);
    }
  }
});

console.log("Missing motion imports in:", badFiles);

