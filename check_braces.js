const fs = require("fs");
const content = fs.readFileSync("src/app/admin/assets/page.tsx", "utf8");
let braceDepth = 0;
let inString = false;
let stringChar = "";
let inTemplate = false;
let line = 1;

for (let i = 0; i < content.length; i++) {
  const ch = content[i];
  const prev = content[i-1];

  if (ch === "\n") { line++; }

  if (!inString && ch === "`" && prev !== "\\") {
    inTemplate = !inTemplate;
    continue;
  }
  if (!inTemplate && (ch === '"' || ch === "'") && prev !== "\\") {
    if (!inString) { inString = true; stringChar = ch; }
    else if (ch === stringChar) { inString = false; }
    continue;
  }

  if (!inString && !inTemplate) {
    if (ch === "{") braceDepth++;
    if (ch === "}") {
      braceDepth--;
      if (braceDepth < 0) {
        console.log("Unmatched } at line", line);
        braceDepth = 0;
      }
    }
  }
}

console.log("Final brace depth:", braceDepth);
console.log("Last line:", line);
