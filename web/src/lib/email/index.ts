/**
 * Email Notification System
 * Provides email sending capabilities with template support
 */

import { logger } from "../logger";

export interface Email {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private templates: Map<string, EmailTemplate> = new Map();
  private provider: string = "console"; // console, sendgrid, mailgun, ses
  private apiKey?: string;

  /**
   * Set email provider
   */
  setProvider(provider: string, apiKey?: string): void {
    this.provider = provider;
    this.apiKey = apiKey;
    logger.info("Email provider set", { provider });
  }

  /**
   * Register an email template
   */
  registerTemplate(template: EmailTemplate): void {
    this.templates.set(template.name, template);
    logger.info("Email template registered", { name: template.name });
  }

  /**
   * Send an email
   */
  async sendEmail(email: Email): Promise<{ success: boolean; messageId?: string }> {
    try {
      logger.info("Sending email", { to: email.to, subject: email.subject });

      switch (this.provider) {
        case "console":
          return this.sendConsoleEmail(email);
        case "sendgrid":
          return this.sendSendGridEmail(email);
        case "mailgun":
          return this.sendMailgunEmail(email);
        default:
          return this.sendConsoleEmail(email);
      }
    } catch (error) {
      logger.error("Failed to send email", {
        to: email.to,
        subject: email.subject,
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false };
    }
  }

  /**
   * Send email using console (for development)
   */
  private async sendConsoleEmail(email: Email): Promise<{ success: boolean; messageId?: string }> {
    logger.info("Email (console)", {
      to: email.to,
      subject: email.subject,
      htmlLength: email.html.length,
    });

    return {
      success: true,
      messageId: `console_${Date.now()}`,
    };
  }

  /**
   * Send email using SendGrid
   */
  private async sendSendGridEmail(email: Email): Promise<{ success: boolean; messageId?: string }> {
    if (!this.apiKey) {
      throw new Error("SendGrid API key not configured");
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email.to }],
          },
        ],
        from: {
          email: email.from || "noreply@specforge.dev",
          name: "SpecForge",
        },
        subject: email.subject,
        content: [
          {
            type: "text/plain",
            value: email.text || email.html.replace(/<[^>]*>/g, ""),
          },
          {
            type: "text/html",
            value: email.html,
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        messageId: data.headers?.["X-Message-Id"],
      };
    }

    throw new Error(`SendGrid error: ${response.status}`);
  }

  /**
   * Send email using Mailgun
   */
  private async sendMailgunEmail(email: Email): Promise<{ success: boolean; messageId?: string }> {
    if (!this.apiKey) {
      throw new Error("Mailgun API key not configured");
    }

    const formData = new FormData();
    formData.append("from", email.from || "noreply@specforge.dev");
    formData.append("to", email.to);
    formData.append("subject", email.subject);
    formData.append("html", email.html);
    if (email.text) {
      formData.append("text", email.text);
    }

    const response = await fetch("https://api.mailgun.net/v3/specforge.dev/messages", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${this.apiKey}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
      };
    }

    throw new Error(`Mailgun error: ${response.status}`);
  }

  /**
   * Send email using template
   */
  async sendTemplatedEmail(
    templateName: string,
    to: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; messageId?: string }> {
    const template = this.templates.get(templateName);

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const html = this.renderTemplate(template.html, data);
    const text = template.text ? this.renderTemplate(template.text, data) : undefined;

    return this.sendEmail({
      to,
      subject: template.subject,
      html,
      text,
    });
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, unknown>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, "g"), String(value));
    }

    return rendered;
  }

  /**
   * Register default templates
   */
  registerDefaultTemplates(): void {
    this.registerTemplate({
      name: "welcome",
      subject: "Welcome to SpecForge",
      html: `
        <h1>Welcome to SpecForge!</h1>
        <p>Hi {{name}},</p>
        <p>Thank you for signing up for SpecForge. We're excited to help you turn your ideas into validated specifications.</p>
        <p>Get started by creating your first document.</p>
        <p>
          <a href="{{dashboardUrl}}">Go to Dashboard</a>
        </p>
      `,
      text: `
        Welcome to SpecForge!
        
        Hi {{name}},
        
        Thank you for signing up for SpecForge. We're excited to help you turn your ideas into validated specifications.
        
        Get started by creating your first document.
        
        Go to Dashboard: {{dashboardUrl}}
      `,
    });

    this.registerTemplate({
      name: "patch_accepted",
      subject: "Your patch was accepted",
      html: `
        <h1>Patch Accepted</h1>
        <p>Hi {{name}},</p>
        <p>Your patch for document "{{documentTitle}}" has been accepted!</p>
        <p>The changes are now live.</p>
        <p>
          <a href="{{documentUrl}}">View Document</a>
        </p>
      `,
      text: `
        Patch Accepted
        
        Hi {{name}},
        
        Your patch for document "{{documentTitle}}" has been accepted!
        
        The changes are now live.
        
        View Document: {{documentUrl}}
      `,
    });

    this.registerTemplate({
      name: "patch_rejected",
      subject: "Your patch was rejected",
      html: `
        <h1>Patch Rejected</h1>
        <p>Hi {{name}},</p>
        <p>Your patch for document "{{documentTitle}}" was rejected.</p>
        <p>Reason: {{reason}}</p>
        <p>Please review the feedback and submit an updated patch.</p>
        <p>
          <a href="{{documentUrl}}">View Document</a>
        </p>
      `,
      text: `
        Patch Rejected
        
        Hi {{name}},
        
        Your patch for document "{{documentTitle}}" was rejected.
        
        Reason: {{reason}}
        
        Please review the feedback and submit an updated patch.
        
        View Document: {{documentUrl}}
      `,
    });

    this.registerTemplate({
      name: "export_ready",
      subject: "Your export is ready",
      html: `
        <h1>Export Ready</h1>
        <p>Hi {{name}},</p>
        <p>Your export for document "{{documentTitle}}" is ready.</p>
        <p>Format: {{format}}</p>
        <p>
          <a href="{{exportUrl}}">Download Export</a>
        </p>
      `,
      text: `
        Export Ready
        
        Hi {{name}},
        
        Your export for document "{{documentTitle}}" is ready.
        
        Format: {{format}}
        
        Download Export: {{exportUrl}}
      `,
    });

    logger.info("Default email templates registered", { count: 4 });
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
    emailService.registerDefaultTemplates();
  }
  return emailService;
}

/**
 * Send an email (convenience function)
 */
export async function sendEmail(email: Email): Promise<{ success: boolean; messageId?: string }> {
  const service = getEmailService();
  return await service.sendEmail(email);
}

/**
 * Send a templated email (convenience function)
 */
export async function sendTemplatedEmail(
  templateName: string,
  to: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string }> {
  const service = getEmailService();
  return await service.sendTemplatedEmail(templateName, to, data);
}