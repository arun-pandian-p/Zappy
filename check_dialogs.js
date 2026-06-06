import fs from "fs";
import path from "path";

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walk(dirFile, filelist);
    } else if (dirFile.endsWith(".tsx")) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walk("./src");

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("from \"@/components/ui/dialog\"") || content.includes("from '@/components/ui/dialog'")) {
    let missing = [];
    if (!content.includes("<DialogTitle")) missing.push("DialogTitle");
    if (!content.includes("<DialogDescription") && content.includes("<DialogContent")) missing.push("DialogDescription");
    if (!content.includes("aria-describedby")) missing.push("aria-describedby");
    
    if (missing.length > 0 && content.includes("<Dialog>")) {
      console.log(`File: ${file} is missing: ${missing.join(", ")}`);
    }
  }
});

