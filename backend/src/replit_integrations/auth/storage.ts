import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(email: string, password: string, userData?: Partial<UpsertUser>): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUserWithPassword(email: string, password: string, userData?: Partial<UpsertUser>): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 12);
    
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        provider: "email",
        ...userData,
      })
      .returning();
    
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 12);
    
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  }
}

export const authStorage = new AuthStorage();
