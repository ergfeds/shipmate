import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const heartbeat = mutation({
  args: { fingerprint: v.string(), path: v.string(), region: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let user = await ctx.db.query("online_users")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", args.fingerprint))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { lastSeen: Date.now(), currentPath: args.path, region: args.region });
    } else {
      await ctx.db.insert("online_users", {
        fingerprint: args.fingerprint,
        currentPath: args.path,
        region: args.region,
        lastSeen: Date.now()
      });
    }
  }
});

export const getOnlineUsers = query({
  handler: async (ctx) => {
    const threshold = Date.now() - 60000; // 1 minute
    return await ctx.db.query("online_users")
      .filter(q => q.gt(q.field("lastSeen"), threshold))
      .collect();
  }
});
