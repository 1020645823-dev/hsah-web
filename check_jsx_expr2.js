const fs = require("fs");
const content = fs.readFileSync("src/app/admin/assets/page.tsx", "utf8");
let exprDepth = 0;
let inString = false;
let stringChar = "";
let inTemplate = false;
let inJSX = false;
let line = 1;
const stack = [];

for (let i = 0; i < content.length; i++) {
  const ch = content[i];
  const prev = content[i - 1];

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
    if (ch === "<" && !inJSX && content[i+1] !== " " && content[i+1] !== "/") {
      inJSX = true;
    }
    if (inJSX && ch === ">") {
      inJSX = false;
    }

    if (inJSX) {
      if (ch === "{") {
        exprDepth++;
        stack.push({ line, ch });
      }
      if (ch === "}") {
        exprDepth--;
        stack.pop();
        if (exprDepth < 0) {
          console.log("Unmatched } in JSX at line", line);
          exprDepth = 0;
        }
      }
    }
  }
}

console.log("Final JSX expr depth:", exprDepth);
console.log("Unclosed { stack:", stack);
