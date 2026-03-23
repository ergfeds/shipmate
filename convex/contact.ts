import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contact_submissions", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contact_submissions").order("desc").collect();
  },
});

export const markRead = mutation({
  args: { id: v.id("contact_submissions") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isRead: true });
    return { success: true };
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("contact_submissions").collect();
    return all.filter((c) => !c.isRead).length;
  },
});
