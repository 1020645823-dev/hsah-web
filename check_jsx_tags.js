const fs = require("fs");
const content = fs.readFileSync("src/app/admin/assets/page.tsx", "utf8");

// Find all lines with < or >
const lines = content.split('\n');
let jsxTagDepth = 0;
let inJSXExpr = false;
let inString = false;
let stringChar = '';
let inTemplate = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let lineTagDepth = 0;
  
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    const prev = j > 0 ? line[j-1] : '';
    
    if (!inString && ch === '`' && prev !== '\\') {
      inTemplate = !inTemplate;
      continue;
    }
    if (!inTemplate && (ch === '"' || ch === "'") && prev !== '\\') {
      if (!inString) { inString = true; stringChar = ch; }
      else if (ch === stringChar) { inString = false; }
      continue;
    }
    
    if (inString || inTemplate) continue;
    
    if (ch === '{') {
      inJSXExpr = true;
      continue;
    }
    if (ch === '}') {
      inJSXExpr = false;
      continue;
    }
    
    if (inJSXExpr) continue;
    
    if (ch === '<') {
      const next = line[j+1];
      if (next && next !== ' ' && next !== '/') {
        // opening tag
        lineTagDepth++;
      } else if (next === '/') {
        // closing tag
        lineTagDepth--;
      }
    }
    if (ch === '>' && line[j-1] === '/') {
      lineTagDepth--;
    }
  }
  
  jsxTagDepth += lineTagDepth;
  if (jsxTagDepth !== 0 && i >= 175 && i <= 325) {
    console.log(`Line ${i+1}: depth=${jsxTagDepth}, lineTagDepth=${lineTagDepth}, content: ${line.trim().substring(0, 60)}`);
  }
}

console.log("Final JSX tag depth:", jsxTagDepth);
