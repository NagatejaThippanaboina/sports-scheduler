const { spawnSync } = require("child_process");
const path = require("path");

const tests = [
    path.join(__dirname, "runConflictTest.js"),
    path.join(__dirname, "runSportDeletionTest.js"),
];

console.log("==================================================");
console.log("SPORTS SCHEDULER — RUNNING AUTOMATED TEST SUITE");
console.log("==================================================");

let allPassed = true;

for (const testFile of tests) {
    const testName = path.basename(testFile);
    console.log(`\n▶ Running ${testName}...`);
    const result = spawnSync(process.execPath, [testFile], {
        stdio: "inherit",
        env: process.env,
    });

    if (result.status !== 0) {
        console.error(`✖ ${testName} failed with exit code ${result.status}`);
        allPassed = false;
        break;
    } else {
        console.log(`✔ ${testName} completed successfully.`);
    }
}

console.log("\n==================================================");
if (allPassed) {
    console.log("ALL TEST SUITES PASSED SUCCESSFULLY!");
    console.log("==================================================");
    process.exit(0);
} else {
    console.error("SOME TESTS FAILED.");
    console.log("==================================================");
    process.exit(1);
}
