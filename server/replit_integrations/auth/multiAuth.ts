import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { OIDCStrategy as AzureADStrategy } from "passport-azure-ad";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { authStorage } from "./storage";

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  provider: string;
}

export async function upsertUserFromProfile(profile: UserProfile) {
  return await authStorage.upsertUser({
    id: `${profile.provider}:${profile.id}`,
    email: profile.email,
    firstName: profile.firstName || null,
    lastName: profile.lastName || null,
    profileImageUrl: profile.profileImageUrl || null,
    provider: profile.provider,
  });
}

export function configureGoogleStrategy() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials not configured");
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    scope: ["profile", "email"]
  }, async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
    try {
      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.emails?.[0]?.value || "",
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        profileImageUrl: profile.photos?.[0]?.value,
        provider: "google"
      };
      
      const user = await upsertUserFromProfile(userProfile);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
}

export function configureGitHubStrategy() {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.warn("GitHub OAuth credentials not configured");
    return;
  }

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback",
    scope: ["user:email"]
  }, async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
    try {
      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.emails?.[0]?.value || "",
        firstName: profile.displayName?.split(' ')[0],
        lastName: profile.displayName?.split(' ').slice(1).join(' '),
        profileImageUrl: profile.photos?.[0]?.value,
        provider: "github"
      };
      
      const user = await upsertUserFromProfile(userProfile);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
}

export function configureLinkedInStrategy() {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    console.warn("LinkedIn OAuth credentials not configured");
    return;
  }

  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: "/api/auth/linkedin/callback",
    scope: ["r_liteprofile", "r_emailaddress"]
  }, async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
    try {
      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.emails?.[0]?.value || "",
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        profileImageUrl: profile.photos?.[0]?.value,
        provider: "linkedin"
      };
      
      const user = await upsertUserFromProfile(userProfile);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
}

export function configureAzureADStrategy() {
  if (!process.env.AZURE_AD_CLIENT_ID || !process.env.AZURE_AD_CLIENT_SECRET || !process.env.AZURE_AD_TENANT_ID) {
    console.warn("Azure AD credentials not configured");
    return;
  }

  passport.use(new AzureADStrategy({
    identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    responseType: "code id_token",
    responseMode: "form_post",
    redirectUrl: "/api/auth/azuread/callback",
    allowHttpForRedirectUrl: process.env.NODE_ENV !== "production",
    scope: ["profile", "email", "openid"],
    passReqToCallback: false
  }, async (iss: string, sub: string, profile: any, accessToken: string, refreshToken: string, done: (error: any, user?: any) => void) => {
    try {
      const userProfile: UserProfile = {
        id: profile.oid,
        email: profile._json?.email || "",
        firstName: profile._json?.given_name,
        lastName: profile._json?.family_name,
        provider: "azuread"
      };
      
      const user = await upsertUserFromProfile(userProfile);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
}

export function configureLocalStrategy() {
  passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
  }, async (email, password, done) => {
    try {
      const user = await authStorage.getUserByEmail(email);
      
      if (!user) {
        return done(null, false, { message: "Invalid email or password" });
      }
      
      if (!user.passwordHash) {
        return done(null, false, { message: "Please use your OAuth provider to login" });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValid) {
        return done(null, false, { message: "Invalid email or password" });
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
}

export function configureAllStrategies() {
  configureGoogleStrategy();
  configureGitHubStrategy();
  configureLinkedInStrategy();
  configureAzureADStrategy();
  configureLocalStrategy();
}