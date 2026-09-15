const express = require("express");

const { Sport } = require("../models");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/admin/dashboard", requireAdmin, async (req, res) => {
    try {
        const sports = await Sport.findAll({
            where: {
                createdBy: req.user.id,
            },
            order: [["createdAt", "DESC"]],
        });

        res.render("admin/dashboard", {
            sports,
            user: req.user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});

router.get("/admin/sports/new", requireAdmin, (req, res) => {
    res.render("admin/create-sport");
});

router.post("/admin/sports", requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).send("Sport name is required.");
        }

        await Sport.create({
            name: name.trim(),
            createdBy: req.user.id,
        });

        res.redirect("/admin/dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});

module.exports = router;