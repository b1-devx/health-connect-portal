import jwt from "jsonwebtoken";
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    req.user = {
      id: payload.sub,
      claims: { sub: payload.sub },
      email: payload.email,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export async function setupAuth(app: Express) {
  app.post("/api/auth/sync-user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email, profileImageUrl } = req.body;
      await db
        .insert(users)
        .values({ id: userId, email: email || null, firstName: firstName || null, lastName: lastName || null, profileImageUrl: profileImageUrl || null })
        .onConflictDoUpdate({
          target: users.id,
          set: { email: email || undefined, firstName: firstName || undefined, lastName: lastName || undefined, updatedAt: new Date() },
        });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error syncing user:", err);
      res.status(500).json({ message: "Failed to sync user" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      res.json(user || null);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export function registerAuthRoutes(app: Express) {
  app.get("/api/logout", (_req, res) => {
    res.json({ ok: true });
  });
}
