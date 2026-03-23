import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("shipment_update"),
      v.literal("system"),
      v.literal("promotion"),
      v.literal("alert")
    ),
    shipmentId: v.optional(v.id("shipments")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, { isRead: true });
    return { success: true };
  },
});

export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(
      notifications.filter((n) => !n.isRead).map((n) => ctx.db.patch(n._id, { isRead: true }))
    );
    return { success: true };
  },
});

export const broadcastToAll = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("shipment_update"),
      v.literal("system"),
      v.literal("promotion"),
      v.literal("alert")
    ),
  },
  handler: async (ctx, { title, message, type }) => {
    const users = await ctx.db.query("users").collect();
    await Promise.all(
      users.map((user) =>
        ctx.db.insert("notifications", {
          userId: user._id,
          title,
          message,
          type,
          isRead: false,
          createdAt: Date.now(),
        })
      )
    );
    return { success: true, count: users.length };
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return notifications.filter((n) => !n.isRead).length;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("notifications").order("desc").collect();
  },
});
