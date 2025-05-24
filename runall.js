const { execSync } = require("child_process");

function runScript(file) {
  const start = new Date().toISOString();
  console.log(`\n▶ [${start}] Running: ${file}`);
  try {
    execSync(`node ${file}`, { stdio: "inherit" });
    const end = new Date().toISOString();
    console.log(`✅ [${end}] Finished: ${file}`);
  } catch (err) {
    const errorTime = new Date().toISOString();
    console.error(`❌ [${errorTime}] Failed: ${file}`);
    process.exit(1); // Exit with failure to stop GitHub Actions run
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