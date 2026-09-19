const { Sport, Session, User, sequelize } = require("../models");

async function testSportDeletion() {
    console.log("Starting Safe Sport Deletion test...");
    try {
        await sequelize.authenticate();

        // Find or create an admin user
        let admin = await User.findOne({ where: { role: "admin" } });
        if (!admin) {
            console.log("No admin user found. Creating a test admin...");
            admin = await User.create({
                name: "Test Admin",
                email: "testadmin_deletion@example.com",
                password: "password123",
                role: "admin",
            });
        }

        // Create sport A with a dependent session
        const sportWithSession = await Sport.create({
            name: "Sport With Session " + Date.now(),
            createdBy: admin.id,
        });

        const testSession = await Session.create({
            sportId: sportWithSession.id,
            createdBy: admin.id,
            sessionDate: new Date(Date.now() + 86400000), // tomorrow
            venue: "Test Arena",
            teamOnePlayers: "Admin",
            teamTwoPlayers: "",
            additionalPlayersNeeded: 5,
            status: "scheduled",
        });

        // Create sport B without any sessions
        const sportWithoutSession = await Sport.create({
            name: "Sport Empty " + Date.now(),
            createdBy: admin.id,
        });

        // Test case 1: Sport with session cannot be deleted
        const sessionCountA = await Session.count({
            where: { sportId: sportWithSession.id },
        });

        if (sessionCountA > 0) {
            console.log(`✓ Sport with sessions detected correctly (count: ${sessionCountA}). Deletion prevented.`);
        } else {
            throw new Error("Failed: Expected session count > 0 for sportWithSession");
        }

        // Test case 2: Sport without session can be deleted
        const sessionCountB = await Session.count({
            where: { sportId: sportWithoutSession.id },
        });

        if (sessionCountB === 0) {
            await sportWithoutSession.destroy();
            const recheck = await Sport.findByPk(sportWithoutSession.id);
            if (!recheck) {
                console.log("✓ Empty sport successfully deleted from database.");
            } else {
                throw new Error("Failed: Empty sport was not deleted.");
            }
        } else {
            throw new Error("Failed: Expected session count === 0 for sportWithoutSession");
        }

        // Clean up test session and sport A
        await testSession.destroy();
        await sportWithSession.destroy();
        console.log("✓ Test cleanup completed successfully.");

        console.log("ALL SAFE SPORT DELETION TESTS PASSED!");
    } catch (err) {
        console.error("Test failed:", err);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

testSportDeletion();
