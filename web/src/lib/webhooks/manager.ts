/**
 * Webhook Infrastructure
 * Provides webhook delivery with retry logic and signature verification
 */

import { logger } from "../logger";
import crypto from "crypto";

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: number;
  lastDeliveredAt?: number;
  deliveryCount: number;
  failureCount: number;
}

export interface WebhookPayload {
  id: string;
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
  signature?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  payload: WebhookPayload;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: number;
  deliveredAt?: number;
}

class WebhookManager {
  private webhooks: Map<string, Webhook> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();

  /**
   * Register a webhook
   */
  register(webhook: Omit<Webhook, "id" | "createdAt" | "deliveryCount" | "failureCount">): string {
    const id = this.generateWebhookId();
    const newWebhook: Webhook = {
      ...webhook,
      id,
      createdAt: Date.now(),
      deliveryCount: 0,
      failureCount: 0,
    };

    this.webhooks.set(id, newWebhook);
    logger.info("Webhook registered", { id, url: webhook.url, events: webhook.events });

    return id;
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId: string): Webhook | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * Get all webhooks
   */
  getAllWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Get webhooks by event
   */
  getWebhooksByEvent(event: string): Webhook[] {
    return Array.from(this.webhooks.values()).filter(
      (w) => w.active && w.events.includes(event)
    );
  }

  /**
   * Update webhook
   */
  updateWebhook(webhookId: string, updates: Partial<Webhook>): void {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const updated = { ...webhook, ...updates };
    this.webhooks.set(webhookId, updated);
    logger.info("Webhook updated", { webhookId, updates });
  }

  /**
   * Delete webhook
   */
  deleteWebhook(webhookId: string): void {
    this.webhooks.delete(webhookId);
    logger.info("Webhook deleted", { webhookId });
  }

  /**
   * Trigger webhooks for an event
   */
  async triggerEvent(event: string, data: Record<string, unknown>): Promise<void> {
    const webhooks = this.getWebhooksByEvent(event);

    if (webhooks.length === 0) {
      logger.info("No webhooks to trigger for event", { event });
      return;
    }

    logger.info("Triggering webhooks", { event, count: webhooks.length });

    const payload: WebhookPayload = {
      id: this.generatePayloadId(),
      event,
      timestamp: Date.now(),
      data,
    };

    for (const webhook of webhooks) {
      await this.deliverWebhook(webhook, payload);
    }
  }

  /**
   * Deliver webhook to endpoint
   */
  private async deliverWebhook(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    const deliveryId = this.generateDeliveryId();
    const signature = this.generateSignature(payload, webhook.secret);

    const signedPayload: WebhookPayload = {
      ...payload,
      signature,
    };

    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: webhook.id,
      payload: signedPayload,
      status: "pending",
      attempts: 0,
      createdAt: Date.now(),
    };

    this.deliveries.set(deliveryId, delivery);

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-ID": payload.id,
          "X-Webhook-Event": payload.event,
          "User-Agent": "SpecForge-Webhook/1.0",
        },
        body: JSON.stringify(signedPayload),
      });

      delivery.responseCode = response.status;
      delivery.responseBody = await response.text();

      if (response.ok) {
        delivery.status = "delivered";
        delivery.deliveredAt = Date.now();

        webhook.deliveryCount++;
        webhook.lastDeliveredAt = Date.now();

        logger.info("Webhook delivered", {
          deliveryId,
          webhookId: webhook.id,
          status: response.status,
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${delivery.responseBody}`);
      }
    } catch (error) {
      delivery.status = "failed";
      delivery.error = error instanceof Error ? error.message : String(error);

      webhook.failureCount++;

      logger.error("Webhook delivery failed", {
        deliveryId,
        webhookId: webhook.id,
        error: delivery.error,
      });

      // Retry with exponential backoff
      await this.retryDelivery(webhook, delivery);
    }

    this.deliveries.set(deliveryId, delivery);
  }

  /**
   * Retry failed delivery
   */
  private async retryDelivery(webhook: Webhook, delivery: WebhookDelivery): Promise<void> {
    const maxAttempts = 3;
    if (delivery.attempts >= maxAttempts) {
      logger.error("Webhook delivery failed permanently", {
        deliveryId: delivery.id,
        attempts: delivery.attempts,
      });
      return;
    }

    const delay = Math.pow(2, delivery.attempts) * 1000; // Exponential backoff

    logger.info("Retrying webhook delivery", {
      deliveryId: delivery.id,
      attempt: delivery.attempts + 1,
      delay,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));

    delivery.attempts++;
    delivery.status = "pending";

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": delivery.payload.signature || "",
          "X-Webhook-ID": delivery.payload.id,
          "X-Webhook-Event": delivery.payload.event,
          "User-Agent": "SpecForge-Webhook/1.0",
        },
        body: JSON.stringify(delivery.payload),
      });

      delivery.responseCode = response.status;
      delivery.responseBody = await response.text();

      if (response.ok) {
        delivery.status = "delivered";
        delivery.deliveredAt = Date.now();

        webhook.deliveryCount++;
        webhook.lastDeliveredAt = Date.now();

        logger.info("Webhook retry succeeded", {
          deliveryId: delivery.id,
          attempt: delivery.attempts,
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${delivery.responseBody}`);
      }
    } catch (error) {
      delivery.status = "failed";
      delivery.error = error instanceof Error ? error.message : String(error);
      webhook.failureCount++;

      logger.error("Webhook retry failed", {
        deliveryId: delivery.id,
        attempt: delivery.attempts,
        error: delivery.error,
      });

      // Retry again if max attempts not reached
      if (delivery.attempts < maxAttempts) {
        await this.retryDelivery(webhook, delivery);
      }
    }

    this.deliveries.set(delivery.id, delivery);
  }

  /**
   * Generate signature for webhook payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac("sha256", secret)
      .update(payloadString)
      .digest("hex");
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get delivery by ID
   */
  getDelivery(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveries.get(deliveryId);
  }

  /**
   * Get deliveries for a webhook
   */
  getDeliveriesForWebhook(webhookId: string): WebhookDelivery[] {
    return Array.from(this.deliveries.values()).filter(
      (d) => d.webhookId === webhookId
    );
  }

  /**
   * Get webhook statistics
   */
  getStats() {
    const webhooks = Array.from(this.webhooks.values());
    const deliveries = Array.from(this.deliveries.values());

    return {
      webhooks: {
        total: webhooks.length,
        active: webhooks.filter((w) => w.active).length,
        inactive: webhooks.filter((w) => !w.active).length,
      },
      deliveries: {
        total: deliveries.length,
        pending: deliveries.filter((d) => d.status === "pending").length,
        delivered: deliveries.filter((d) => d.status === "delivered").length,
        failed: deliveries.filter((d) => d.status === "failed").length,
      },
    };
  }

  /**
   * Generate a unique webhook ID
   */
  private generateWebhookId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique payload ID
   */
  private generatePayloadId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique delivery ID
   */
  private generateDeliveryId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let webhookManager: WebhookManager | null = null;

export function getWebhookManager(): WebhookManager {
  if (!webhookManager) {
    webhookManager = new WebhookManager();
  }
  return webhookManager;
}

/**
 * Trigger a webhook event (convenience function)
 */
export async function triggerWebhook(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const manager = getWebhookManager();
  await manager.triggerEvent(event, data);
}