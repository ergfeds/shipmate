import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSession = query({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("chat_sessions")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", args.fingerprint))
      .first();
  }
});

export const startSession = mutation({
  args: { fingerprint: v.string(), userName: v.optional(v.string()), userEmail: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let session = await ctx.db.query("chat_sessions")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", args.fingerprint))
      .first();
    if (session) {
      await ctx.db.patch(session._id, { 
        lastActive: Date.now(), 
        userName: args.userName || session.userName,
        userEmail: args.userEmail || session.userEmail 
      });
      return session._id;
    }
    return await ctx.db.insert("chat_sessions", {
      fingerprint: args.fingerprint,
      status: "active",
      lastActive: Date.now(),
      userName: args.userName,
      userEmail: args.userEmail
    });
  }
});

export const getMessages = query({
  args: { sessionId: v.optional(v.id("chat_sessions")) },
  handler: async (ctx, args) => {
    if (!args.sessionId) return [];
    const sessionId = args.sessionId;
    return await ctx.db.query("chat_messages")
      .withIndex("by_session", q => q.eq("sessionId", sessionId))
      .collect();
  }
});

export const sendMessage = mutation({
  args: { sessionId: v.id("chat_sessions"), sender: v.union(v.literal("user"), v.literal("admin")), text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { lastActive: Date.now() });
    return await ctx.db.insert("chat_messages", {
      sessionId: args.sessionId,
      sender: args.sender,
      text: args.text,
      createdAt: Date.now()
    });
  }
});

export const getActiveSessions = query({
  handler: async (ctx) => {
    const sessions = await ctx.db.query("chat_sessions").order("desc").collect();
    const withMessages = await Promise.all(sessions.map(async s => {
      const messages = await ctx.db.query("chat_messages").withIndex("by_session", q => q.eq("sessionId", s._id)).collect();
      return { ...s, messages };
    }));
    return withMessages.filter(s => s.messages.length > 0);
  }
});
