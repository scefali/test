const ts = require("typescript");
const fs = require("fs");

function isModuleExport(statement) {
  if (statement.kind !== ts.SyntaxKind.ExpressionStatement) {
    return false;
  }
  if (!statement.expression) {
    return false;
  }
  const { left } = statement.expression;
  // check if this is module.exports
  return (
    left.expression?.escapedText === "module" &&
    left.name?.escapedText === "exports"
  );
}

function getSourceVariableName(statement) {
  if (statement.kind !== ts.SyntaxKind.ExpressionStatement) {
    return false;
  }
  if (!statement.expression) {
    return false;
  }
  const { right } = statement.expression;
  return right?.escapedText;
}

function genOutput({ topText, declarationText }) {
  const baseFile = fs.readFileSync("next.config.template.js", "utf8");
  const newText = baseFile
    .replace("// INSERT TOP TEXT", topText)
    .replace("// INSERT CONFIG TEXT", declarationText);
  fs.writeFileSync("next.config.new.js", newText);
}

const node = ts.createSourceFile(
  "x.ts", // fileName
  fs.readFileSync("next.config.js", "utf8"), // sourceText
  ts.ScriptTarget.Latest // langugeVersion
);

const sourceText = node.text;

let topText, declarationText, sourceVariableName;
for (const statement of node.statements) {
  if (statement.expression?.left) {
  }
  if (isModuleExport(statement)) {
    // console.log('is module export')
    sourceVariableName = getSourceVariableName(statement);
  }
}

// go through again to get declaration text
for (const statement of node.statements) {
  console.log("statement", statement);
  if (statement.declarationList) {
    const { declarationList } = statement;
    const declaration = declarationList.declarations[0];
    if (declaration.name.escapedText !== sourceVariableName) {
      continue;
    }
    const { initializer } = declaration;
    console.log({ declaration });
    const text = sourceText.substring(initializer.pos, initializer.end).trim();
    console.log({ text });
    if (text[0] === "{" && text[text.length - 1] === "}") {
      declarationText = text.substring(1, text.length - 1);
      const endPosOftopText = statement.jsDoc?.length
        ? statement.jsDoc[0].start
        : initializer.pos;
      if (endPosOftopText > 0) {
        topText = sourceText.substring(0, endPosOftopText);
      } else {
        topText = "";
      }
    }
  }
}

console.log({ declarationText, topText, sourceVariableName });

if (declarationText && topText !== undefined) {
  genOutput({ topText, declarationText });
}
