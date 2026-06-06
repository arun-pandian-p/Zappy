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

const hooksToCheck = ["useState", "useEffect", "useRef", "useMemo", "useCallback", "useNavigate", "useLocation", "Link"];

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  
  hooksToCheck.forEach(hook => {
    // Basic heuristic: if hook is called like hook( or <Link
    const regex = new RegExp(`\\b${hook}\\b\\s*[\\(\\<]`);
    if (regex.test(content)) {
      // Check if it is imported
      const importRegex = new RegExp(`import\\s+{.*?\\b${hook}\\b.*?}\\s+from`);
      if (!importRegex.test(content)) {
         console.log(`Missing ${hook} in ${file}`);
      }
    }
  });
});

