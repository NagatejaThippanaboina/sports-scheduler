const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");

const { User } = require("../models");

const router = express.Router();

// ===============================
// SIGN UP
// ===============================

router.get("/signup", (req, res) => {
    res.render("signup", {
        errorMessages: req.flash("error"),
        successMessages: req.flash("success"),
    });
});

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            req.flash("error", "All fields are required.");
            return res.redirect("/signup");
        }

        if (password.trim().length < 6) {
            req.flash("error", "Password must be at least 6 characters long.");
            return res.redirect("/signup");
        }

        const existingUser = await User.findOne({
            where: { email: email.toLowerCase().trim() },
        });

        if (existingUser) {
            req.flash("error", "Email is already registered. Please sign in.");
            return res.redirect("/signup");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "player",
        });

        req.flash("success", "Account created successfully! Please sign in.");
        res.redirect("/login");
    } catch (error) {
        console.error("Signup error:", error);
        req.flash("error", "An error occurred during sign up. Please try again.");
        res.redirect("/signup");
    }
});

// ===============================
// LOGIN
// ===============================

router.get("/login", (req, res) => {
    res.render("login", {
        errorMessages: req.flash("error"),
        successMessages: req.flash("success"),
    });
});

router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: "Invalid email or password.",
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
            req.flash("error", "Please fill in all required password fields.");
            return res.redirect("/profile#change-password");
        }

        if (newPassword !== confirmPassword) {
            req.flash("error", "New password and confirmation password do not match.");
            return res.redirect("/profile#change-password");
        }

        if (newPassword.trim().length < 6) {
            req.flash("error", "New password must be at least 6 characters long.");
            return res.redirect("/profile#change-password");
        }

        const user = await User.findByPk(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            req.flash("error", "Current password is incorrect.");
            return res.redirect("/profile#change-password");
        }

        user.password = await bcrypt.hash(newPassword.trim(), 10);
        await user.save();

        req.flash("success", "Password changed successfully.");
        res.redirect("/profile#change-password");

    } catch (error) {
        console.error("Change Password Error:", error);
        req.flash("error", "An error occurred while updating your password.");
        res.redirect("/profile#change-password");
    }
});

module.exports = router;