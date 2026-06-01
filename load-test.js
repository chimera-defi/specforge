/**
 * Load Testing Configuration (k6)
 * Load testing scripts for performance validation
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const responseTime = new Trend("response_time");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 },  // Ramp up to 10 users
    { duration: "1m", target: 10 },   // Stay at 10 users
    { duration: "30s", target: 50 },  // Ramp up to 50 users
    { duration: "1m", target: 50 },   // Stay at 50 users
    { duration: "30s", target: 100 }, // Ramp up to 100 users
    { duration: "1m", target: 100 },  // Stay at 100 users
    { duration: "30s", target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.01"],   // Error rate must be less than 1%
    errors: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "health status is 200": (r) => r.status === 200,
  }) || errorRate.add(1);

  responseTime.add(healthRes.timings.duration);

  // Test document list endpoint
  const docsRes = http.get(`${BASE_URL}/api/documents`);
  check(docsRes, {
    "documents status is 200": (r) => r.status === 200,
  }) || errorRate.add(1);

  responseTime.add(docsRes.timings.duration);

  sleep(1);
}