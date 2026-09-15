const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");

const { User } = require("../models");

const router = express.Router();

// ===============================
// SIGN UP
// ===============================

router.get("/signup", (req, res) => {
    res.render("signup");
});

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.send("All fields are required.");
        }

        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            return res.send("Email is already registered.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashedPassword,
            role: "player",
        });

        res.redirect("/login");
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});

// ===============================
// LOGIN
// ===============================

router.get("/login", (req, res) => {
    res.render("login");
});

router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
    }),
    (req, res) => {
        if (req.user.role === "admin") {
            return res.redirect("/admin/dashboard");
        }

        res.redirect("/dashboard");
    }
);

// ===============================
// LOGOUT
// ===============================

router.post("/logout", (req, res, next) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }

        req.session.destroy(() => {
            res.redirect("/");
        });
    });
});

module.exports = router;