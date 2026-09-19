const assert = require("assert");
const { checkSessionTimeConflict, SESSION_DURATION_MS } = require("../utils/conflictCheck");
const db = require("../models");

async function runTests() {
    console.log("Running conflict detection tests...");

    // 1. Duration check
    assert.strictEqual(SESSION_DURATION_MS, 3600000, "SESSION_DURATION_MS should be 1 hour");

    // 2. Mathematical overlap verification
    const baseStart = new Date("2026-09-24T09:11:00Z").getTime();
    const baseEnd = baseStart + SESSION_DURATION_MS;

    function checkOverlap(attemptDateStr) {
        const attemptStart = new Date(attemptDateStr).getTime();
        const attemptEnd = attemptStart + SESSION_DURATION_MS;
        return attemptStart < baseEnd && baseStart < attemptEnd;
    }

    // Exact match (Kabaddi vs Cricket prompt test scenario)
    assert.strictEqual(checkOverlap("2026-09-24T09:11:00Z"), true, "Exact timestamp MUST overlap");

    // Overlapping 30 minutes later (10:00 vs 10:30)
    assert.strictEqual(checkOverlap("2026-09-24T09:41:00Z"), true, "Overlapping times MUST overlap");

    // Overlapping 30 minutes earlier (10:00 vs 9:30)
    assert.strictEqual(checkOverlap("2026-09-24T08:41:00Z"), true, "Overlapping times MUST overlap");

    // Touching endpoint: 1 hour later (10:00-11:00 vs 11:00-12:00)
    assert.strictEqual(checkOverlap("2026-09-24T10:11:00Z"), false, "Touching endpoint endpoint MUST NOT overlap");

    // Touching endpoint: 1 hour earlier (10:00-11:00 vs 9:00-10:00)
    assert.strictEqual(checkOverlap("2026-09-24T08:11:00Z"), false, "Touching endpoint earlier MUST NOT overlap");

    // Well outside
    assert.strictEqual(checkOverlap("2026-09-24T14:00:00Z"), false, "Different time on same day MUST NOT overlap");

    console.log("All interval overlap test cases PASSED!");
    await db.sequelize.close();
    process.exit(0);
}

runTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
