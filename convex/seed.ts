import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Must match hashPassword() in users.ts
function hash(str: string): string {
  return btoa(str + "shipmate_salt_2025");
}

export default internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create Admin User
    const existingAdmin = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", "admin@cargoparcelexpress.com")).first();
    if (!existingAdmin) {
      await ctx.db.insert("users", {
        name: "Super Admin",
        email: "admin@cargoparcelexpress.com",
        role: "admin",
        passwordHash: hash("18552219"),
        isActive: true,
        createdAt: Date.now()
      });
    }

    // 2. Seed default settings (skip if already present)
    const existingSettings = await ctx.db.query("settings").take(1);
    if (existingSettings.length === 0) {
      const DEFAULT_SETTINGS = [
        { key: "company_name",    value: "Cargo Parcel Express",                           category: "general", label: "Company Name" },
        { key: "company_tagline", value: "Global Logistics, Delivered with Precision", category: "general", label: "Tagline" },
        { key: "contact_email",  value: "info@cargoparcelexpress.com",                    category: "contact", label: "Contact Email" },
        { key: "contact_phone",  value: "+1 605-368-3701",                         category: "contact", label: "Contact Phone" },
        { key: "contact_address",value: "USA",     category: "contact", label: "Office Address" },
        { key: "contact_hours",  value: "Mon–Fri 08:00–20:00 EST | Sat 09:00–16:00 EST", category: "contact", label: "Business Hours" },
        { key: "social_twitter",   value: "", category: "social", label: "Twitter URL" },
        { key: "social_linkedin",  value: "", category: "social", label: "LinkedIn URL" },
        { key: "social_facebook",  value: "", category: "social", label: "Facebook URL" },
        { key: "social_instagram", value: "", category: "social", label: "Instagram URL" },
        { key: "smtp_host",        value: "",    category: "smtp", label: "SMTP Host" },
        { key: "smtp_port",        value: "587", category: "smtp", label: "SMTP Port" },
        { key: "smtp_user",        value: "",    category: "smtp", label: "SMTP Username" },
        { key: "smtp_pass",        value: "",    category: "smtp", label: "SMTP Password" },
        { key: "smtp_from",        value: "noreply@cargoparcelexpress.com", category: "smtp", label: "From Email" },
        { key: "resend_api_key",   value: "", category: "api", label: "Resend API Key" },
        { key: "mapbox_token",     value: "", category: "api", label: "Mapbox Access Token" },
        { key: "call_wait_time",   value: "2", category: "general", label: "Call Wait Time (mins)" },
        { key: "live_support_enabled", value: "true", category: "general", label: "Live Support Enabled" },
      ];
      for (const s of DEFAULT_SETTINGS) {
        await ctx.db.insert("settings", { ...s, category: s.category as any, updatedAt: Date.now() });
      }
    }

    // 2. Create Some Mock Shipments
    const existingShipments = await ctx.db.query("shipments").take(1);
    if (existingShipments.length === 0) {
      const mockShipments = [
        {
          trackingNumber: "SHP-AIR-990",
          status: "In Transit",
          senderName: "TechCorp Logistics",
          senderEmail: "dispatch@techcorp.com",
          senderPhone: "1234567890",
          senderAddress: "100 Silicon Way",
          senderCity: "San Francisco",
          senderCountry: "USA",
          senderLng: -122.4194,
          senderLat: 37.7749,

          receiverName: "Global Imports",
          receiverEmail: "receiving@globalimports.com",
          receiverPhone: "0987654321",
          receiverAddress: "50 Trade Wharf",
          receiverCity: "London",
          receiverCountry: "UK",
          receiverLng: -0.1278,
          receiverLat: 51.5074,

          packageType: "Parcel",
          shippingMode: "Air Freight",
          weight: 15,
          weightUnit: "kg",
          description: "Electronics batch",
          quantity: 5,
          isFragile: true,
          requiresRefrigeration: false,
          pickupDate: "2026-03-24",
          estimatedDelivery: "2026-03-27",
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now(),
          currentLocation: "Over Altantic Ocean",
          currentLng: -40.0,
          currentLat: 45.0
        },
        {
          trackingNumber: "SHP-LAND-551",
          status: "Out for Delivery",
          senderName: "German Machinery",
          senderEmail: "info@germanmachinery.de",
          senderPhone: "+4912345678",
          senderAddress: "AutoBahn 1",
          senderCity: "Berlin",
          senderCountry: "Germany",
          senderLng: 13.4050,
          senderLat: 52.5200,

          receiverName: "Italian Manufacturers",
          receiverEmail: "purchasing@italianmfg.it",
          receiverPhone: "+3912345678",
          receiverAddress: "Via Roma",
          receiverCity: "Rome",
          receiverCountry: "Italy",
          receiverLng: 12.4964,
          receiverLat: 41.9028,

          packageType: "Freight",
          shippingMode: "Road Freight",
          weight: 500,
          weightUnit: "kg",
          description: "Industrial equipment components",
          quantity: 2,
          isFragile: false,
          requiresRefrigeration: false,
          pickupDate: "2026-03-20",
          estimatedDelivery: "2026-03-23",
          createdAt: Date.now() - 259200000,
          updatedAt: Date.now(),
          currentLocation: "Milan Distribution Center",
          currentLng: 9.1900,
          currentLat: 45.4642
        }
      ];

      for (const ship of mockShipments) {
        await ctx.db.insert("shipments", ship as any);
      }
    }
  }
});
