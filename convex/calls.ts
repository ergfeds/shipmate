import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const initiateCall = mutation({
  args: { fingerprint: v.string(), caller: v.union(v.literal("user"), v.literal("admin")), trackingNumber: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.caller === "user" && args.trackingNumber) {
      const input = args.trackingNumber;
      let found: any = await ctx.db.query("shipments")
        .withIndex("by_tracking", q => q.eq("trackingNumber", input))
        .first();
        
      if (!found) { // Search by email
         const all = await ctx.db.query("shipments").collect();
         found = all.find(s => s.senderEmail.toLowerCase() === input.toLowerCase() || s.receiverEmail.toLowerCase() === input.toLowerCase());
      }
      if (!found) throw new Error("Could not find any active shipment for this tracking number or email. Call cannot be placed.");
    }
    
    // Check if live chat/call feature is enabled in settings
    const setting = await ctx.db.query("settings").withIndex("by_key", q => q.eq("key", "live_support_enabled")).first();
    if (setting && setting.value === "false" && args.caller === "user") {
      throw new Error("Support calls are currently disabled by administration.");
    }

    // Is admin busy? Check active calls
    const connectedCalls = await ctx.db.query("calls").withIndex("by_status", q => q.eq("status", "connected")).collect();
    if (connectedCalls.length > 0 && args.caller === "user") {
      // Just flag it busy to user? Let's just create it but it might ring forever or admin gets notified. We'll mark it ringing
    }

    return await ctx.db.insert("calls", {
      caller: args.caller,
      fingerprint: args.fingerprint,
      status: "ringing",
      trackingNumber: args.trackingNumber,
      createdAt: Date.now()
    });
  }
});

export const getCalls = query({
  handler: async (ctx) => {
    return await ctx.db.query("calls").order("desc").take(50);
  }
});

export const answerCall = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, { status: "connected" });
  }
});

export const endCall = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, { status: "ended" });
  }
});

export const rejectCall = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return;
    // User-initiated calls that are rejected → missed; admin-initiated → ended
    await ctx.db.patch(args.callId, {
      status: call.caller === "user" ? "missed" : "ended",
    });
  }
});

export const addSignal = mutation({
  args: { callId: v.id("calls"), sender: v.union(v.literal("user"), v.literal("admin")), type: v.union(v.literal("offer"), v.literal("answer"), v.literal("ice-candidate")), data: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("webrtc_signals", {
      callId: args.callId,
      sender: args.sender,
      type: args.type,
      data: args.data,
      createdAt: Date.now()
    });
  }
});

export const getSignals = query({
  args: { callId: v.optional(v.id("calls")) },
  handler: async (ctx, args) => {
    if (!args.callId) return [];
    const callId = args.callId;
    return await ctx.db.query("webrtc_signals")
      .withIndex("by_call", q => q.eq("callId", callId))
      .collect();
  }
});

export const getActiveCallForFingerprint = query({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    const calls = await ctx.db.query("calls")
      .withIndex("by_fingerprint", q => q.eq("fingerprint", args.fingerprint))
      .collect();
    return calls.find(c => c.status === "ringing" || c.status === "connected");
  }
});

// Admin getting live call requests 
export const getActiveCalls = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("calls").order("desc").take(100);
    return all.filter(c => c.status === "ringing" || c.status === "connected");
  }
});

export const isAdminBusy = query({
  handler: async (ctx) => {
    const connected = await ctx.db.query("calls").withIndex("by_status", q => q.eq("status", "connected")).collect();
    return connected.length > 0;
  }
});

export const getUserWaitTime = query({
  handler: async (ctx) => {
    const setting = await ctx.db.query("settings").withIndex("by_key", q => q.eq("key", "call_wait_time")).first();
    const waitTimePerCall = parseInt(setting?.value || "2", 10);
    const ringing = await ctx.db.query("calls").withIndex("by_status", q => q.eq("status", "ringing")).collect();
    // Default min 1 increment
    return Math.max(1, ringing.length) * waitTimePerCall;
  }
});
