const { execSync } = require("child_process");

function runScript(file) {
  console.log(`\n▶ Running: ${file}`);
  try {
    execSync(`node ${file}`, { stdio: "inherit" });
    console.log(`✅ Finished: ${file}`);
  } catch (err) {
    console.error(`❌ Failed: ${file}`);
  }
}

const filesToRun = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : [
      "index.js",
      "importLink.js",
      "R1.1.js",
      "R5.1.4.js",
      "importtable.js",
    ];

for (const file of filesToRun) {
  runScript(file);
}
