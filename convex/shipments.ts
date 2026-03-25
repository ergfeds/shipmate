import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

function generateTrackingNumber(): string {
  const prefix = "SHM";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export const create = mutation({
  args: {
    userId: v.optional(v.id("users")),
    senderName: v.string(),
    senderEmail: v.string(),
    senderPhone: v.string(),
    senderAddress: v.string(),
    senderCity: v.string(),
    senderCountry: v.string(),
    senderLng: v.optional(v.number()),
    senderLat: v.optional(v.number()),
    receiverName: v.string(),
    receiverEmail: v.string(),
    receiverPhone: v.string(),
    receiverAddress: v.string(),
    receiverCity: v.string(),
    receiverCountry: v.string(),
    receiverLng: v.optional(v.number()),
    receiverLat: v.optional(v.number()),
    packageType: v.union(
      v.literal("Document"), v.literal("Parcel"), v.literal("Freight"),
      v.literal("Live Animal"), v.literal("Fragile"), v.literal("Hazardous"),
      v.literal("Perishable"), v.literal("Oversized")
    ),
    shippingMode: v.union(
      v.literal("Air Freight"), v.literal("Sea Freight"),
      v.literal("Road Freight"), v.literal("Express")
    ),
    weight: v.number(),
    weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
    dimensions: v.optional(v.object({
      length: v.number(), width: v.number(), height: v.number(),
      unit: v.union(v.literal("cm"), v.literal("in")),
    })),
    description: v.string(),
    quantity: v.number(),
    isFragile: v.boolean(),
    requiresRefrigeration: v.boolean(),
    specialInstructions: v.optional(v.string()),
    pickupDate: v.string(),
    estimatedDelivery: v.string(),
  },
  handler: async (ctx, args) => {
    const trackingNumber = generateTrackingNumber();
    const now = Date.now();

    const shipmentId = await ctx.db.insert("shipments", {
      ...args,
      trackingNumber,
      status: "Pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("status_history", {
      shipmentId,
      status: "Pending",
      note: "Shipment created and pending confirmation.",
      timestamp: now,
    });

    return { shipmentId, trackingNumber };
  },
});

export const getByTracking = query({
  args: { trackingNumber: v.string() },
  handler: async (ctx, { trackingNumber }) => {
    const shipment = await ctx.db
      .query("shipments")
      .withIndex("by_tracking", (q) => q.eq("trackingNumber", trackingNumber))
      .first();
    return shipment;
  },
});

export const getStatusHistory = query({
  args: { shipmentId: v.id("shipments") },
  handler: async (ctx, { shipmentId }) => {
    return await ctx.db
      .query("status_history")
      .withIndex("by_shipment", (q) => q.eq("shipmentId", shipmentId))
      .order("asc")
      .collect();
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("shipments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getAll = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit }) => {
    let q = ctx.db.query("shipments").order("desc");
    const results = await q.collect();
    const filtered = status ? results.filter((s) => s.status === status) : results;
    return limit ? filtered.slice(0, limit) : filtered;
  },
});

export const updateStatus = mutation({
  args: {
    shipmentId: v.id("shipments"),
    status: v.union(
      v.literal("Pending"), v.literal("Order Confirmed"), v.literal("Awaiting Pickup"),
      v.literal("Picked Up"), v.literal("In Transit"), v.literal("On Hold"),
      v.literal("Arrived at Facility"), v.literal("Customs Clearance in Progress"),
      v.literal("Held at Customs"), v.literal("Out for Delivery"),
      v.literal("Delivery Attempted"), v.literal("Delivered"), v.literal("Delayed"),
      v.literal("Exception"), v.literal("Returned to Sender"), v.literal("Cancelled")
    ),
    location: v.optional(v.string()),
    lng: v.optional(v.number()),
    lat: v.optional(v.number()),
    note: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, { shipmentId, status, location, lng, lat, note, updatedBy }) => {
    // Build location patch: if new coords provided use them; if location text
    // changed but no coords, clear old coords so pin never mismatches the text.
    const locationPatch: Record<string, unknown> = {};
    if (location !== undefined) locationPatch.currentLocation = location;
    if (lat !== undefined) {
      locationPatch.currentLat = lat;
    } else if (location !== undefined) {
      locationPatch.currentLat = undefined; // clear stale pin
    }
    if (lng !== undefined) {
      locationPatch.currentLng = lng;
    } else if (location !== undefined) {
      locationPatch.currentLng = undefined; // clear stale pin
    }

    await ctx.db.patch(shipmentId, {
      status,
      updatedAt: Date.now(),
      ...locationPatch,
    });

    await ctx.db.insert("status_history", {
      shipmentId,
      status,
      location,
      lng,
      lat,
      note,
      timestamp: Date.now(),
      updatedBy,
    });

    return { success: true };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("shipments").collect();
    const total = all.length;
    const delivered = all.filter((s) => s.status === "Delivered").length;
    const inTransit = all.filter((s) => s.status === "In Transit").length;
    const pending = all.filter((s) => s.status === "Pending" || s.status === "Awaiting Pickup").length;
    const delayed = all.filter((s) => s.status === "Delayed" || s.status === "On Hold").length;
    return { total, delivered, inTransit, pending, delayed };
  },
});

export const deleteShipment = mutation({
  args: { shipmentId: v.id("shipments") },
  handler: async (ctx, { shipmentId }) => {
    await ctx.db.delete(shipmentId);
    return { success: true };
  },
});

export const updateShipment = mutation({
  args: {
    shipmentId: v.id("shipments"),
    senderName: v.string(),
    senderEmail: v.string(),
    senderPhone: v.string(),
    senderAddress: v.string(),
    senderCity: v.string(),
    senderCountry: v.string(),
    receiverName: v.string(),
    receiverEmail: v.string(),
    receiverPhone: v.string(),
    receiverAddress: v.string(),
    receiverCity: v.string(),
    receiverCountry: v.string(),
    packageType: v.union(
      v.literal("Document"), v.literal("Parcel"), v.literal("Freight"),
      v.literal("Live Animal"), v.literal("Fragile"), v.literal("Hazardous"),
      v.literal("Perishable"), v.literal("Oversized")
    ),
    shippingMode: v.union(
      v.literal("Air Freight"), v.literal("Sea Freight"),
      v.literal("Road Freight"), v.literal("Express")
    ),
    weight: v.number(),
    weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
    description: v.string(),
    quantity: v.number(),
    isFragile: v.boolean(),
    requiresRefrigeration: v.boolean(),
    specialInstructions: v.optional(v.string()),
    pickupDate: v.string(),
    estimatedDelivery: v.string(),
    dimensions: v.optional(v.object({
      length: v.number(), width: v.number(), height: v.number(),
      unit: v.union(v.literal("cm"), v.literal("in")),
    })),
    senderLat: v.optional(v.number()),
    senderLng: v.optional(v.number()),
    receiverLat: v.optional(v.number()),
    receiverLng: v.optional(v.number()),
  },
  handler: async (ctx, { shipmentId, ...fields }) => {
    await ctx.db.patch(shipmentId, { ...fields, updatedAt: Date.now() });
    return { success: true };
  },
});

export const getById = query({
  args: { shipmentId: v.id("shipments") },
  handler: async (ctx, { shipmentId }) => {
    return await ctx.db.get(shipmentId);
  },
});
