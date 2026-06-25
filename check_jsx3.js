const fs = require("fs");
const content = fs.readFileSync("src/app/admin/assets/page.tsx", "utf8");
let jsxDepth = 0;
let inString = false;
let stringChar = "";
let inTemplate = false;
let inJSXExpr = false;
let line = 1;
let inTag = false;
let tagBuffer = "";
const tagStack = [];

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
    if (ch === "{") {
      inJSXExpr = true;
      continue;
    }
    if (ch === "}") {
      inJSXExpr = false;
      continue;
    }

    if (inJSXExpr) continue;

    if (ch === "<" && !inTag) {
      inTag = true;
      tagBuffer = "";
      continue;
    }
    if (inTag) {
      if (ch === ">") {
        inTag = false;
        const tag = tagBuffer.trim();
        if (tag.startsWith("/")) {
          const closed = tag.slice(1).split(/\s/)[0];
          const last = tagStack[tagStack.length - 1];
          if (last && last.tag !== closed) {
            console.log("Mismatched tag at line", line, "- expected </" + last.tag + "> but got </" + closed + ">");
          }
          tagStack.pop();
          jsxDepth--;
        } else if (!tag.endsWith("/") && !tag.startsWith("!") && !tag.startsWith("?")) {
          const tagName = tag.split(/\s/)[0];
          tagStack.push({ tag: tagName, line });
          jsxDepth++;
        }
        tagBuffer = "";
      } else {
        tagBuffer += ch;
      }
    }
  }
}

console.log("Final JSX depth:", jsxDepth);
console.log("Unclosed tags:", tagStack.map(t => t.tag + " (line " + t.line + ")"));
