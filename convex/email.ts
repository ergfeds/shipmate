"use node";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import nodemailer from "nodemailer";
import dns from "dns/promises";
import net from "net";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getEmailSettings(ctx: any) {
  const all = await ctx.runQuery(api.settings.getAll, {});
  const get = (key: string) => all.find((s: any) => s.key === key)?.value || "";
  const smtpUser = get("smtp_user").trim();
  const configuredHost = get("smtp_host").trim();
  const inferredHost =
    smtpUser.endsWith("@gmail.com") || smtpUser.endsWith("@googlemail.com")
      ? "smtp.gmail.com"
      : "";

  return {
    smtpHost: configuredHost || inferredHost,
    smtpPort: get("smtp_port") || "587",
    smtpUser,
    smtpPass: get("smtp_pass") || get("smtp_password"),
    from: get("smtp_from").trim() || smtpUser || "noreply@veloxgloballogistics.com",
    companyName: get("company_name") || "Velox Global Cargo",
    contactEmail: get("contact_email") || "info@veloxgloballogistics.com",
    contactPhone: get("contact_phone") || "+1 605-368-3701",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveSmtpHost(host: string) {
  const normalizedHost = host.trim();
  if (!normalizedHost) {
    throw new Error("SMTP host is not configured. Set it in Admin Settings before sending email.");
  }
  if (net.isIP(normalizedHost)) {
    return normalizedHost;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const ipv4Records = await dns.resolve4(normalizedHost);
      if (ipv4Records.length > 0) {
        return ipv4Records[0];
      }
    } catch (error: any) {
      if (!["EBUSY", "EAI_AGAIN", "ENOTFOUND", "ENODATA"].includes(error?.code)) {
        throw error;
      }
    }

    try {
      const ipv6Records = await dns.resolve6(normalizedHost);
      if (ipv6Records.length > 0) {
        return ipv6Records[0];
      }
    } catch (error: any) {
      if (!["EBUSY", "EAI_AGAIN", "ENOTFOUND", "ENODATA"].includes(error?.code)) {
        throw error;
      }
    }

    if (attempt < 2) {
      await sleep(250 * (attempt + 1));
    }
  }

  throw new Error(`Could not resolve SMTP host "${normalizedHost}".`);
}

function getSmtpPort(portValue: string) {
  const port = Number.parseInt(portValue, 10);
  return Number.isFinite(port) ? port : 587;
}

function getFromAddress(cfg: any) {
  const smtpUser = (cfg.smtpUser || "").trim();
  const from = (cfg.from || "").trim();
  const host = (cfg.smtpHost || "").toLowerCase();
  const isGmail = host === "smtp.gmail.com" || smtpUser.endsWith("@gmail.com") || smtpUser.endsWith("@googlemail.com");

  if (isGmail && smtpUser) {
    return smtpUser;
  }

  return from || smtpUser;
}

async function sendViaSmtp(
  cfg: any,
  to: string,
  subject: string,
  html: string,
) {
  if (!cfg.smtpUser || !cfg.smtpPass) {
    throw new Error("SMTP settings not fully configured (User or App Password missing).");
  }

  const host = (cfg.smtpHost || "").trim();
  const ip = await resolveSmtpHost(host);
  const port = getSmtpPort(cfg.smtpPort || "587");
  const fromAddress = getFromAddress(cfg);

  try {
    const transporter = nodemailer.createTransport({
      host: ip,
      port,
      secure: port === 465,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      auth: {
        user: (cfg.smtpUser || "").trim(),
        pass: (cfg.smtpPass || "").trim(),
      },
      tls: {
        rejectUnauthorized: true,
        servername: host,
      },
    });

    await transporter.sendMail({
      from: `${cfg.companyName} <${fromAddress}>`,
      to,
      subject,
      html,
    });
  } catch (error: any) {
    if (error?.code === "EAUTH") {
      throw new Error("SMTP authentication failed. Check the SMTP user and app password in Admin Settings.");
    }
    if (error?.code === "EBUSY" || error?.code === "EAI_AGAIN" || error?.code === "ENOTFOUND") {
      throw new Error(`SMTP host "${host}" could not be resolved from Convex. Verify the host or try again.`);
    }
    if (error?.responseCode === 550 || error?.responseCode === 553) {
      throw new Error("SMTP rejected the sender address. Use the authenticated mailbox as the From Address.");
    }
    throw error;
  }
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

function welcomeEmailHtml(opts: {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  recipientName: string;
}): string {
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
      <h2 style="color:#22c55e;margin:0 0 12px;">Welcome to ${opts.companyName}!</h2>
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 20px;">We are thrilled to have you on board. Start tracking your global shipments easily.</p>

      <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;">
        If you have any questions, reply to this email or contact us at
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
    const cfg = await getEmailSettings(ctx);
    
    await sendViaSmtp(
      cfg,
      to,
      `✅ Email Test — ${cfg.companyName}`,
      `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
  <tr><td style="padding:32px 24px 16px;">
    <h1 style="color:#f5c542;font-size:22px;margin:0;">${cfg.companyName}</h1>
  </td></tr>
  <tr><td style="padding:0 24px;">
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px;">
      <h2 style="color:#22c55e;margin:0 0 12px;">Email Configuration Working!</h2>
      <p style="color:#e2e8f0;font-size:14px;">This is a test email from <strong>${cfg.companyName}</strong>.</p>
      <p style="color:#94a3b8;font-size:13px;">From: ${cfg.from}</p>
    </div>
  </td></tr>
  <tr><td style="padding:20px 24px;text-align:center;">
    <p style="color:#475569;font-size:12px;">&copy; ${new Date().getFullYear()} ${cfg.companyName}</p>
  </td></tr>
</table></body></html>`,
    );

    return { success: true };
  },
});

// ── Internal action: send welcome email ─────────────────────────────

export const sendWelcomeEmail = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { name, email }) => {
    const cfg = await getEmailSettings(ctx);
    if (!cfg.smtpUser) return; // silently skip if not configured

    const subject = `Welcome to — ${cfg.companyName}`;
    const opts = {
      companyName: cfg.companyName,
      contactEmail: cfg.contactEmail,
      contactPhone: cfg.contactPhone,
      recipientName: name,
    };

    try {
      await sendViaSmtp(
        cfg,
        email,
        subject,
        welcomeEmailHtml(opts),
      );
    } catch (err: any) {
      console.error(`Failed to email ${email}:`, err.message);
    }
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
    const cfg = await getEmailSettings(ctx);
    if (!cfg.smtpUser) return; // silently skip if not configured

    const shipment: any = await ctx.runQuery(api.shipments.getById, {
      shipmentId: shipmentId as any,
    });
    if (!shipment) return;

    const baseOpts = {
      companyName: cfg.companyName,
      contactEmail: cfg.contactEmail,
      contactPhone: cfg.contactPhone,
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

    const subject = `Shipment ${shipment.trackingNumber} — ${status}`;
    const emails: { to: string; name: string }[] = [];

    if (shipment.receiverEmail) {
      emails.push({ to: shipment.receiverEmail, name: shipment.receiverName });
    }
    if (shipment.senderEmail && shipment.senderEmail !== shipment.receiverEmail) {
      emails.push({ to: shipment.senderEmail, name: shipment.senderName });
    }
    if (cfg.contactEmail) {
        // Also send to admin
        emails.push({ to: cfg.contactEmail, name: "Admin" });
    }

    for (const { to, name } of emails) {
      try {
        await sendViaSmtp(
          cfg,
          to,
          subject,
          shipmentEmailHtml({ ...baseOpts, recipientName: name }),
        );
      } catch (err: any) {
        console.error(`Failed to email ${to}:`, err.message);
      }
    }
  },
});
