import type { Express } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

export function registerMultiAuthRoutes(app: Express): void {
  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google"));

  app.get("/api/auth/google/callback",
    passport.authenticate("google", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login?error=auth_failed"
    })
  );

  // GitHub OAuth routes
  app.get("/api/auth/github", passport.authenticate("github"));

  app.get("/api/auth/github/callback",
    passport.authenticate("github", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login?error=auth_failed"
    })
  );

  // LinkedIn OAuth routes
  app.get("/api/auth/linkedin", passport.authenticate("linkedin"));

  app.get("/api/auth/linkedin/callback",
    passport.authenticate("linkedin", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login?error=auth_failed"
    })
  );

  // Azure AD OAuth routes
  app.get("/api/auth/azuread", passport.authenticate("azuread-openidconnect"));

  app.post("/api/auth/azuread/callback",
    passport.authenticate("azuread-openidconnect", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login?error=auth_failed"
    })
  );

  // Email/Password registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await authStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create new user
      const user = await authStorage.createUserWithPassword(email, password, {
        firstName,
        lastName
      });

      // Auto-login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Registration successful but login failed" });
        }
        res.json({ message: "Registration successful", user });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Email/Password login
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  });

  // Password reset request
  app.post("/api/auth/forgot-password", async (req, res) => {
    // TODO: Implement password reset functionality
    res.json({ message: "Password reset email sent (not implemented)" });
  });

  // Get available auth providers
  app.get("/api/auth/providers", (req, res) => {
    const providers = {
      google: !!process.env.GOOGLE_CLIENT_ID,
      github: !!process.env.GITHUB_CLIENT_ID,
      linkedin: !!process.env.LINKEDIN_CLIENT_ID,
      azuread: !!process.env.AZURE_AD_CLIENT_ID,
      email: true,
      replit: !!process.env.REPL_ID
    };

    res.json(providers);
  });

  // Update user password (authenticated users only)
  app.post("/api/auth/update-password", isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required" });
      }

      const user = await authStorage.getUser(userId);
      if (!user?.passwordHash) {
        return res.status(400).json({ error: "No password set for this account" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Update password
      await authStorage.updateUserPassword(userId, newPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ error: "Password update failed" });
    }
  });
}