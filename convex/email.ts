"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import nodemailer from "nodemailer";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getSmtpSettings(ctx: any) {
  const all = await ctx.runQuery(api.settings.getAll, {});
  const get = (key: string) => all.find((s: any) => s.key === key)?.value || "";
  return {
    host: get("smtp_host"),
    port: parseInt(get("smtp_port") || "587", 10),
    user: get("smtp_user"),
    pass: get("smtp_pass") || get("smtp_password"),
    from: get("smtp_from") || "noreply@veloxgloballogistics.com",
    companyName: get("company_name") || "Velox Global Cargo",
    contactEmail: get("contact_email") || "info@veloxgloballogistics.com",
    contactPhone: get("contact_phone") || "+1 605-368-3701",
  };
}

function createTransporter(smtp: { host: string; port: number; user: string; pass: string }) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    "Pending": "#f59e0b",
    "Order Confirmed": "#3b82f6",
    "Picked Up": "#8b5cf6",
    "In Transit": "#06b6d4",
    "Arrived at Facility": "#6366f1",
    "Customs Clearance in Progress": "#d97706",
    "Out for Delivery": "#0ea5e9",
    "Delivered": "#22c55e",
    "On Hold": "#ef4444",
    "Delayed": "#ef4444",
    "Exception": "#dc2626",
    "Returned to Sender": "#9ca3af",
    "Cancelled": "#6b7280",
  };
  return map[status] || "#3b82f6";
}

function shipmentEmailHtml(opts: {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  trackingNumber: string;
  status: string;
  location?: string;
  note?: string;
  recipientName: string;
  senderCity: string;
  senderCountry: string;
  receiverCity: string;
  receiverCountry: string;
  packageType: string;
  shippingMode: string;
  estimatedDelivery: string;
}): string {
  const color = statusColor(opts.status);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
  <tr><td style="padding:32px 24px 16px;">
    <h1 style="color:#f5c542;font-size:22px;margin:0;">${opts.companyName}</h1>
    <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Global Logistics, Delivered with Precision</p>
  </td></tr>
  <tr><td style="padding:0 24px;">
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px;">
      <p style="color:#cbd5e1;font-size:14px;margin:0 0 16px;">Dear ${opts.recipientName},</p>
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 20px;">Your shipment status has been updated:</p>

      <div style="background:#0f172a;border-radius:8px;padding:20px;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Tracking Number</td>
          </tr>
          <tr>
            <td style="color:#f5c542;font-size:20px;font-weight:700;letter-spacing:1px;padding-bottom:16px;">${opts.trackingNumber}</td>
          </tr>
          <tr>
            <td style="padding-bottom:12px;">
              <span style="display:inline-block;background:${color};color:#fff;font-size:13px;font-weight:600;padding:6px 14px;border-radius:20px;">${opts.status}</span>
            </td>
          </tr>
          ${opts.location ? `<tr><td style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Current Location</td></tr><tr><td style="color:#e2e8f0;font-size:14px;padding-bottom:12px;">${opts.location}</td></tr>` : ""}
          ${opts.note ? `<tr><td style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Note</td></tr><tr><td style="color:#e2e8f0;font-size:14px;padding-bottom:12px;">${opts.note}</td></tr>` : ""}
        </table>
      </div>

      <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="vertical-align:top;padding-right:12px;">
              <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">From</p>
              <p style="color:#e2e8f0;font-size:13px;margin:0;">${opts.senderCity}, ${opts.senderCountry}</p>
            </td>
            <td width="50%" style="vertical-align:top;">
              <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">To</p>
              <p style="color:#e2e8f0;font-size:13px;margin:0;">${opts.receiverCity}, ${opts.receiverCountry}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;">
              <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Mode</p>
              <p style="color:#e2e8f0;font-size:13px;margin:0;">${opts.shippingMode}</p>
            </td>
            <td style="padding-top:12px;">
              <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Est. Delivery</p>
              <p style="color:#e2e8f0;font-size:13px;margin:0;">${opts.estimatedDelivery}</p>
            </td>
          </tr>
        </table>
      </div>

      <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;">
        If you have questions, reply to this email or contact us at
        <a href="mailto:${opts.contactEmail}" style="color:#f5c542;text-decoration:none;">${opts.contactEmail}</a>
        or call <strong style="color:#e2e8f0;">${opts.contactPhone}</strong>.
      </p>
    </div>
  </td></tr>
  <tr><td style="padding:20px 24px;text-align:center;">
    <p style="color:#475569;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} ${opts.companyName}. All rights reserved.</p>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Public action: send test email ──────────────────────────────────────────

export const sendTest = action({
  args: { to: v.string() },
  handler: async (ctx, { to }) => {
    const smtp = await getSmtpSettings(ctx);
    if (!smtp.host || !smtp.user || !smtp.pass) {
      throw new Error("SMTP not configured. Fill in host, user, and password in Settings first.");
    }

    const transporter = createTransporter(smtp);
    await transporter.sendMail({
      from: `"${smtp.companyName}" <${smtp.from}>`,
      to,
      subject: `✅ SMTP Test — ${smtp.companyName}`,
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
  <tr><td style="padding:32px 24px 16px;">
    <h1 style="color:#f5c542;font-size:22px;margin:0;">${smtp.companyName}</h1>
  </td></tr>
  <tr><td style="padding:0 24px;">
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px;">
      <h2 style="color:#22c55e;margin:0 0 12px;">SMTP Configuration Working!</h2>
      <p style="color:#e2e8f0;font-size:14px;">This is a test email from <strong>${smtp.companyName}</strong>.</p>
      <p style="color:#94a3b8;font-size:13px;">SMTP Host: ${smtp.host}:${smtp.port}<br/>From: ${smtp.from}</p>
    </div>
  </td></tr>
  <tr><td style="padding:20px 24px;text-align:center;">
    <p style="color:#475569;font-size:12px;">&copy; ${new Date().getFullYear()} ${smtp.companyName}</p>
  </td></tr>
</table></body></html>`,
    });

    return { success: true };
  },
});

// ── Internal action: send shipment status email ─────────────────────────────

export const sendShipmentStatusEmail = internalAction({
  args: {
    shipmentId: v.string(),
    status: v.string(),
    location: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { shipmentId, status, location, note }) => {
    const smtp = await getSmtpSettings(ctx);
    if (!smtp.host || !smtp.user || !smtp.pass) return; // silently skip if not configured

    const shipment: any = await ctx.runQuery(api.shipments.getById, {
      shipmentId: shipmentId as any,
    });
    if (!shipment) return;

    const transporter = createTransporter(smtp);
    const baseOpts = {
      companyName: smtp.companyName,
      contactEmail: smtp.contactEmail,
      contactPhone: smtp.contactPhone,
      trackingNumber: shipment.trackingNumber,
      status,
      location,
      note,
      senderCity: shipment.senderCity,
      senderCountry: shipment.senderCountry,
      receiverCity: shipment.receiverCity,
      receiverCountry: shipment.receiverCountry,
      packageType: shipment.packageType,
      shippingMode: shipment.shippingMode,
      estimatedDelivery: shipment.estimatedDelivery,
    };

    const subject = `📦 Shipment ${shipment.trackingNumber} — ${status}`;
    const emails: { to: string; name: string }[] = [];

    // Email receiver
    if (shipment.receiverEmail) {
      emails.push({ to: shipment.receiverEmail, name: shipment.receiverName });
    }
    // Email sender
    if (shipment.senderEmail) {
      emails.push({ to: shipment.senderEmail, name: shipment.senderName });
    }

    for (const { to, name } of emails) {
      try {
        await transporter.sendMail({
          from: `"${smtp.companyName}" <${smtp.from}>`,
          to,
          subject,
          html: shipmentEmailHtml({ ...baseOpts, recipientName: name }),
        });
      } catch (err: any) {
        console.error(`Failed to email ${to}:`, err.message);
      }
    }
  },
});
