import dotenv from "dotenv";
dotenv.config();

import * as Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail({ to, subject, html }) {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = { name: "Vendly", email: process.env.EMAIL_USER };
  sendSmtpEmail.to = [{ email: to }];

  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log("✅ Email sent to", to);
}

export async function sendOTPEmail(to, otp, name) {
  await sendEmail({
    to,
    subject: "Verify your Vendly account",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1E3A5F;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#2563EB;font-size:28px;font-weight:900;">Vendly</h1>
                  <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">Nigeria's trusted marketplace</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;font-weight:700;">Hi ${name}! 👋</h2>
                  <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                    Welcome to Vendly! Use the verification code below to activate your account:
                  </p>
                  <div style="background:#f3f4f6;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                      Your Verification Code
                    </p>
                    <div style="letter-spacing:12px;font-size:42px;font-weight:900;color:#1E3A5F;font-family:monospace;">
                      ${otp}
                    </div>
                    <p style="margin:12px 0 0;color:#ef4444;font-size:13px;font-weight:600;">⏰ Expires in 10 minutes</p>
                  </div>
                  <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
                    If you did not create a Vendly account, you can safely ignore this email.
                  </p>
                  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;">
                    <p style="margin:0;color:#1e40af;font-size:13px;">
                      🔒 <strong>Security tip:</strong> Vendly will never ask for your password or OTP via phone or chat.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 Vendly. All rights reserved. Lagos, Nigeria</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendWelcomeEmail(to, name) {
  await sendEmail({
    to,
    subject: "Welcome to Vendly! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1E3A5F;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#2563EB;font-size:28px;font-weight:900;">Vendly</h1>
                  <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">Nigeria's trusted marketplace</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;text-align:center;">
                  <div style="font-size:64px;margin-bottom:16px;">🎉</div>
                  <h2 style="margin:0 0 12px;color:#1f2937;font-size:24px;font-weight:700;">Welcome aboard, ${name}!</h2>
                  <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
                    Your Vendly account is now verified and active. Shop from hundreds of trusted vendors across Nigeria!
                  </p>
                  <a href="https://vendly-store.vercel.app/"
                    style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">
                    Start Shopping →
                  </a>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 Vendly. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(to, otp, name) {
  await sendEmail({
    to,
    subject: "Reset your Vendly password",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1E3A5F;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#2563EB;font-size:28px;font-weight:900;">Vendly</h1>
                  <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">Nigeria's trusted marketplace</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;font-weight:700;">
                    Password Reset Request 🔐
                  </h2>
                  <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                    Hi ${name}, we received a request to reset your Vendly password.
                    Use the code below to reset it:
                  </p>
                  <div style="background:#f3f4f6;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                      Password Reset Code
                    </p>
                    <div style="letter-spacing:12px;font-size:42px;font-weight:900;color:#1E3A5F;font-family:monospace;">
                      ${otp}
                    </div>
                    <p style="margin:12px 0 0;color:#ef4444;font-size:13px;font-weight:600;">
                      ⏰ Expires in 10 minutes
                    </p>
                  </div>
                  <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
                    If you did not request a password reset, please ignore this email.
                    Your password will remain unchanged.
                  </p>
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;">
                    <p style="margin:0;color:#991b1b;font-size:13px;">
                      🚨 <strong>Warning:</strong> Never share this code with anyone.
                      Vendly staff will never ask for this code.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 Vendly. All rights reserved. Lagos, Nigeria</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function sendOrderConfirmationEmail(to, name, order) {
  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${item.image}" alt="${item.name}"
            style="width:48px;height:48px;border-radius:8px;object-fit:cover;" />
          <div>
            <p style="margin:0;font-weight:600;color:#1f2937;font-size:14px;">${item.name}</p>
            <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">Qty: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#1f2937;">
        ₦${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>`,
    )
    .join("");

  await sendEmail({
    to,
    subject: `Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()} 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:#1E3A5F;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#2563EB;font-size:28px;font-weight:900;">Vendly</h1>
                  <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">Nigeria's trusted marketplace</p>
                </td>
              </tr>

              <!-- Success Banner -->
              <tr>
                <td style="background:#f0fdf4;padding:24px 40px;text-align:center;border-bottom:1px solid #e5e7eb;">
                  <div style="font-size:48px;margin-bottom:8px;">🎉</div>
                  <h2 style="margin:0;color:#166534;font-size:20px;font-weight:700;">Order Confirmed!</h2>
                  <p style="margin:8px 0 0;color:#4b7280;font-size:14px;">
                    Thank you ${name}! Your order has been placed successfully.
                  </p>
                </td>
              </tr>

              <!-- Order ID -->
              <tr>
                <td style="padding:24px 40px;">
                  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;text-align:center;">
                    <p style="margin:0;color:#1e40af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                      Order Reference
                    </p>
                    <p style="margin:8px 0 0;color:#1e3a5f;font-size:22px;font-weight:900;font-family:monospace;letter-spacing:2px;">
                      #${order._id.toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Items -->
              <tr>
                <td style="padding:0 40px 24px;">
                  <h3 style="margin:0 0 16px;color:#1f2937;font-size:16px;font-weight:700;">
                    Items Ordered
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                    ${itemsList}
                  </table>
                </td>
              </tr>

              <!-- Price Summary -->
              <tr>
                <td style="padding:0 40px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:16px;">
                    <tr>
                      <td style="padding:6px 16px;color:#6b7280;font-size:14px;">Subtotal</td>
                      <td style="padding:6px 16px;text-align:right;color:#374151;font-weight:600;font-size:14px;">
                        ₦${(order.totalPrice - order.deliveryPrice - order.taxPrice).toLocaleString()}
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding:6px 16px;color:#6b7280;font-size:14px;">Delivery Fee</td>
                      <td style="padding:6px 16px;text-align:right;color:#374151;font-weight:600;font-size:14px;">
                        ${order.deliveryPrice === 0 ? "FREE 🎉" : `₦${order.deliveryPrice.toLocaleString()}`}
                      </td>
                    </tr>
                   
                    <tr style="border-top:2px solid #e5e7eb;">
                      <td style="padding:12px 16px;color:#1f2937;font-size:16px;font-weight:700;">Total Paid</td>
                      <td style="padding:12px 16px;text-align:right;color:#2563EB;font-size:18px;font-weight:900;">
                        ₦${(order.totalPrice - order.deliveryPrice).toLocaleString()}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Delivery Address -->
              <tr>
                <td style="padding:0 40px 24px;">
                  <h3 style="margin:0 0 12px;color:#1f2937;font-size:16px;font-weight:700;">
                    Delivery Address
                  </h3>
                  <div style="background:#f9fafb;border-radius:12px;padding:16px;border:1px solid #e5e7eb;">
                    <p style="margin:0;font-weight:700;color:#1f2937;">${order.deliveryAddress.fullName}</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${order.deliveryAddress.phone}</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${order.deliveryAddress.address}</p>
                    <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${order.deliveryAddress.city}, ${order.deliveryAddress.state}</p>
                  </div>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:0 40px 32px;text-align:center;">
                  <a href="https://vendly-store.vercel.app/profile"
                    style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">
                    Track Your Order →
                  </a>
                  <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
                    Questions? Email us at <a href="mailto:support@vendly.ng" style="color:#2563EB;">support@vendly.ng</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 Vendly. All rights reserved. Lagos, Nigeria</p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
