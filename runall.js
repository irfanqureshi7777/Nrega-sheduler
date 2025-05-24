const { execSync } = require("child_process");

function runScript(file) {
  console.log(`\n▶ Running: ${file}`);
  try {
    execSync(`node ${file}`, { stdio: "inherit" });
    console.log(`✅ Finished: ${file}`);
  } catch (err) {
    console.error(`❌ Failed: ${file}`);
    console.error(err.message);
  }
}

function getTimestamp() {
  return new Date().toISOString();
}

// List of scripts to run in order
const filesToRun = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : [
      "index.js",
      "importLink.js",
      "R1.1.js",
      "R5.1.4.js",
      "importtable.js",
    ];

console.log("======== NREGA Scraper Started ========");
console.log("Start time:", getTimestamp());

for (const file of filesToRun) {
  runScript(file);
}

console.log("======== NREGA Scraper Completed ========");
console.log("End time:", getTimestamp());