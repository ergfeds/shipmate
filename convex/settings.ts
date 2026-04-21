import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_SETTINGS = [
  { key: "company_name", value: "Cargo Parcel Express", category: "general", label: "Company Name" },
  { key: "company_tagline", value: "Global Logistics, Delivered with Precision", category: "general", label: "Tagline" },
  { key: "contact_email", value: "info@Cargo Parcel Expressgloballogistics.com", category: "contact", label: "Contact Email" },
  { key: "contact_phone", value: "+1 605-368-3701", category: "contact", label: "Contact Phone" },
  { key: "contact_address", value: "USA", category: "contact", label: "Office Address" },
  { key: "contact_hours", value: "Mon–Fri 08:00–20:00 EST | Sat 09:00–16:00 EST", category: "contact", label: "Business Hours" },
  { key: "social_twitter", value: "", category: "social", label: "Twitter URL" },
  { key: "social_linkedin", value: "", category: "social", label: "LinkedIn URL" },
  { key: "social_facebook", value: "", category: "social", label: "Facebook URL" },
  { key: "social_instagram", value: "", category: "social", label: "Instagram URL" },
  { key: "smtp_host", value: "", category: "smtp", label: "SMTP Host" },
  { key: "smtp_port", value: "587", category: "smtp", label: "SMTP Port" },
  { key: "smtp_user", value: "", category: "smtp", label: "SMTP Username" },
  { key: "smtp_pass", value: "", category: "smtp", label: "SMTP Password" },
  { key: "smtp_from", value: "noreply@Cargo Parcel Expressgloballogistics.com", category: "smtp", label: "From Email" },
  { key: "resend_api_key", value: "", category: "api", label: "Resend API Key" },
  { key: "mapbox_token", value: "", category: "api", label: "Mapbox Access Token" },
  { key: "call_wait_time", value: "2", category: "general", label: "Call Wait Time (mins)" },
];

export const init = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("settings").collect();
    if (existing.length > 0) return { skipped: true };

    for (const s of DEFAULT_SETTINGS) {
      await ctx.db.insert("settings", { ...s, category: s.category as any, updatedAt: Date.now() });
    }
    return { created: DEFAULT_SETTINGS.length };
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("settings").collect();
  },
});

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const all = await ctx.db.query("settings").collect();
    return all.filter((s) => s.category === category);
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (setting) {
      await ctx.db.patch(setting._id, { value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("settings", {
        key, value, category: "general", label: key, updatedAt: Date.now(),
      });
    }
    return { success: true };
  },
});

export const batchUpdate = mutation({
  args: { settings: v.array(v.object({ key: v.string(), value: v.string() })) },
  handler: async (ctx, { settings }) => {
    for (const { key, value } of settings) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { value, updatedAt: Date.now() });
      }
    }
    return { success: true };
  },
});
