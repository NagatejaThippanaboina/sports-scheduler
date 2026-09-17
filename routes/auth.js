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

const { requireAuth } = require("../middleware/auth");

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

// ===============================
// USER PROFILE & PASSWORD CHANGE
// ===============================

router.get("/profile", requireAuth, (req, res) => {
    res.render("profile", {
        user: req.user,
        messages: req.flash(),
    });
});

router.post("/profile/change-password", requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            req.flash("error", "Please fill in all password fields.");
            return res.redirect("/profile");
        }

        if (newPassword !== confirmPassword) {
            req.flash("error", "New password and confirmation password do not match.");
            return res.redirect("/profile");
        }

        if (newPassword.length < 6) {
            req.flash("error", "New password must be at least 6 characters long.");
            return res.redirect("/profile");
        }

        const user = await User.findByPk(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            req.flash("error", "Incorrect current password.");
            return res.redirect("/profile");
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        req.flash("success", "Your password has been changed successfully.");
        res.redirect("/profile");

    } catch (error) {
        console.error("Change Password Error:", error);
        req.flash("error", "An error occurred while updating your password.");
        res.redirect("/profile");
    }
});

module.exports = router;