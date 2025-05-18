const { execSync } = require("child_process");

function runScript(file) {
  console.log(`\n▶ Running: ${file}`);
  try {
    const output = execSync(`node ${file}`, { stdio: "inherit" });
    console.log(`✅ Finished: ${file}`);
  } catch (err) {
    console.error(`❌ Failed: ${file}`);
  }
}

const filesToRun = [
  "index.js",  "importLink.js",  "R1.1.js",  "R5.1.4.js", "importtable.js",
  
];

for (const file of filesToRun) {
  runScript(file);
}
