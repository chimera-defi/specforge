import { logger } from "@/lib/logger";

export function getRequestId(headers: Headers) {
  return headers.get("x-specforge-request-id") ?? "missing-request-id";
}

export function logServerEvent(
  event: string,
  fields: Record<string, unknown> = {},
) {
  logger.info("server_event", {
    event,
    ...fields,
  });
}
