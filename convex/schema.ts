import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    passwordHash: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
  }).index("by_email", ["email"]),

  shipments: defineTable({
    trackingNumber: v.string(),
    userId: v.optional(v.id("users")),
    status: v.union(
      v.literal("Pending"),
      v.literal("Order Confirmed"),
      v.literal("Awaiting Pickup"),
      v.literal("Picked Up"),
      v.literal("In Transit"),
      v.literal("On Hold"),
      v.literal("Arrived at Facility"),
      v.literal("Customs Clearance in Progress"),
      v.literal("Held at Customs"),
      v.literal("Out for Delivery"),
      v.literal("Delivery Attempted"),
      v.literal("Delivered"),
      v.literal("Delayed"),
      v.literal("Exception"),
      v.literal("Returned to Sender"),
      v.literal("Cancelled")
    ),
    // Sender
    senderName: v.string(),
    senderEmail: v.string(),
    senderPhone: v.string(),
    senderAddress: v.string(),
    senderCity: v.string(),
    senderCountry: v.string(),
    senderLng: v.optional(v.number()),
    senderLat: v.optional(v.number()),
    // Receiver
    receiverName: v.string(),
    receiverEmail: v.string(),
    receiverPhone: v.string(),
    receiverAddress: v.string(),
    receiverCity: v.string(),
    receiverCountry: v.string(),
    receiverLng: v.optional(v.number()),
    receiverLat: v.optional(v.number()),
    // Package
    packageType: v.union(
      v.literal("Document"),
      v.literal("Parcel"),
      v.literal("Freight"),
      v.literal("Live Animal"),
      v.literal("Fragile"),
      v.literal("Hazardous"),
      v.literal("Perishable"),
      v.literal("Oversized")
    ),
    shippingMode: v.union(
      v.literal("Air Freight"),
      v.literal("Sea Freight"),
      v.literal("Road Freight"),
      v.literal("Express")
    ),
    weight: v.number(),
    weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
    dimensions: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
      unit: v.union(v.literal("cm"), v.literal("in")),
    })),
    description: v.string(),
    quantity: v.number(),
    isFragile: v.boolean(),
    requiresRefrigeration: v.boolean(),
    specialInstructions: v.optional(v.string()),
    // Dates
    pickupDate: v.string(),
    estimatedDelivery: v.string(),
    // Meta
    createdAt: v.number(),
    updatedAt: v.number(),
    currentLocation: v.optional(v.string()),
    currentLng: v.optional(v.number()),
    currentLat: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_tracking", ["trackingNumber"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  status_history: defineTable({
    shipmentId: v.id("shipments"),
    status: v.string(),
    location: v.optional(v.string()),
    lng: v.optional(v.number()),
    lat: v.optional(v.number()),
    note: v.optional(v.string()),
    timestamp: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_shipment", ["shipmentId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("shipment_update"),
      v.literal("system"),
      v.literal("promotion"),
      v.literal("alert")
    ),
    isRead: v.boolean(),
    shipmentId: v.optional(v.id("shipments")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
    category: v.union(
      v.literal("contact"),
      v.literal("smtp"),
      v.literal("social"),
      v.literal("general"),
      v.literal("api")
    ),
    label: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  contact_submissions: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  }),

  chat_sessions: defineTable({
    fingerprint: v.string(), // Device/browser id tracking
    userId: v.optional(v.id("users")), // If logged in
    status: v.union(v.literal("active"), v.literal("closed")),
    lastActive: v.number(),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  }).index("by_fingerprint", ["fingerprint"]),

  chat_messages: defineTable({
    sessionId: v.id("chat_sessions"),
    sender: v.union(v.literal("user"), v.literal("admin")),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),

  calls: defineTable({
    caller: v.union(v.literal("user"), v.literal("admin")),
    userId: v.optional(v.id("users")),
    fingerprint: v.string(),
    adminId: v.optional(v.id("users")),
    status: v.union(
      v.literal("ringing"),
      v.literal("connected"),
      v.literal("ended"),
      v.literal("missed"),
      v.literal("busy")
    ),
    trackingNumber: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_status", ["status"]).index("by_fingerprint", ["fingerprint"]).index("by_caller", ["caller"]),

  webrtc_signals: defineTable({
    callId: v.id("calls"),
    sender: v.union(v.literal("user"), v.literal("admin")),
    type: v.union(v.literal("offer"), v.literal("answer"), v.literal("ice-candidate")),
    data: v.string(),
    createdAt: v.number(),
  }).index("by_call", ["callId"]),

  online_users: defineTable({
    fingerprint: v.string(),
    userId: v.optional(v.id("users")),
    ip: v.optional(v.string()),
    region: v.optional(v.string()),
    currentPath: v.optional(v.string()),
    lastSeen: v.number()
  }).index("by_fingerprint", ["fingerprint"]),
});
