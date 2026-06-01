import { NextResponse } from "next/server";
import { getEmailService, sendEmail } from "@/lib/email";

/**
 * GET /api/email - Get email service status
 */
export async function GET() {
  return NextResponse.json({
    status: "email_service_available",
    templates: ["welcome", "patch_accepted", "patch_rejected", "export_ready"],
  });
}

/**
 * POST /api/email - Send an email
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { to, subject, html, text, template, data } = body;

  const service = getEmailService();

  if (template) {
    if (!to || !data) {
      return NextResponse.json(
        { error: "to and data are required for templated emails" },
        { status: 400 }
      );
    }

    const result = await service.sendTemplatedEmail(template, to, data);
    return NextResponse.json(result);
  }

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: "to, subject, and html are required" },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to,
    subject,
    html,
    text,
  });

  return NextResponse.json(result);
}