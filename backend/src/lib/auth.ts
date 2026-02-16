import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "../storage";
import bcrypt from "bcryptjs";

export function setupAuth(app: Express) {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        throw new Error("DATABASE_URL must be set for session storage");
    }

    const sessionStore = new pgStore({
        conString: dbUrl,
        createTableIfMissing: false,
        ttl: sessionTtl / 1000,
        tableName: "sessions",
    });

    app.use(session({
        secret: process.env.SESSION_SECRET || "dev-secret",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: sessionTtl,
            sameSite: "lax",
        },
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            const users = await storage.getUsersByRole("student"); // Generic search
            const user = (await storage.getAllUsers()).find(u => u.email === email);

            if (!user || !user.passwordHash) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
};

export function registerAuthRoutes(app: Express) {
    app.post("/api/login", passport.authenticate("local"), (req, res) => {
        res.json(req.user);
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.json({ message: "Logged out" });
        });
    });

    app.get("/api/auth/user", (req, res) => {
        if (req.isAuthenticated()) {
            res.json(req.user);
        } else {
            res.status(401).json({ message: "Not logged in" });
        }
    });
}
