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

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("<TabsContent") && !content.includes("TabsContent") /* need a better regex */) {
  }
  
  if (content.includes("<TabsContent")) {
    const importMatch = content.match(/import\s+{.*?\bTabsContent\b.*?}\s+from\s+["']@\/components\/ui\/tabs["']/);
    
    if (!importMatch) {
      console.log("Missing TabsContent import in:", file);
    }
  }
});

