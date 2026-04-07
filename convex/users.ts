import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple password hashing (in production use bcrypt via HTTP action)
function hashPassword(password: string): string {
  // We'll store a simple hash - in production this would be a proper bcrypt hash
  return btoa(password + "shipmate_salt_2025");
}

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, password, phone }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      throw new ConvexError("Email already registered");
    }

    const userId = await ctx.db.insert("users", {
      name,
      email,
      phone,
      role: "user",
      passwordHash: hashPassword(password),
      isActive: true,
      createdAt: Date.now(),
    });

    return { userId, name, email, role: "user" as const };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) throw new ConvexError("Invalid email or password");
    if (!user.isActive) throw new ConvexError("Account is deactivated");
    if (user.passwordHash !== hashPassword(password)) throw new ConvexError("Invalid email or password");

    await ctx.db.patch(user._id, { lastLoginAt: Date.now() });

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
    };
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const { passwordHash: _, ...safe } = user;
    return safe;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(({ passwordHash: _, ...u }) => u);
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, { userId, ...updates }) => {
    await ctx.db.patch(userId, updates);
    return { success: true };
  },
});

export const createAdmin = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { name, email, password }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      // Update existing to admin
      await ctx.db.patch(existing._id, { role: "admin" });
      return { userId: existing._id };
    }

    const userId = await ctx.db.insert("users", {
      name,
      email,
      role: "admin",
      passwordHash: hashPassword(password),
      isActive: true,
      createdAt: Date.now(),
    });
    return { userId };
  },
});

export const toggleActive = mutation({
  args: { userId: v.id("users"), isActive: v.boolean() },
  handler: async (ctx, { userId, isActive }) => {
    await ctx.db.patch(userId, { isActive });
    return { success: true };
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      admins: users.filter((u) => u.role === "admin").length,
    };
  },
});
