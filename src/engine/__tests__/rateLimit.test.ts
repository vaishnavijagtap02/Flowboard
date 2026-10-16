import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/rateLimit";
import { getModelProfile, MODEL_PROFILES } from "@/lib/models";

describe("rateLimit", () => {
  it("extracts IP correctly from headers", () => {
    const reqWithForwarded = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(reqWithForwarded)).toBe("203.0.113.195");

    const reqWithRealIp = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.1" },
    });
    expect(getClientIp(reqWithRealIp)).toBe("198.51.100.1");

    const reqFallback = new Request("http://localhost/api/test");
    expect(getClientIp(reqFallback)).toBe("127.0.0.1");
  });

  it("allows requests under the limit and blocks when limit is exceeded", () => {
    const uniqueIp = "10.0.0." + Math.floor(Math.random() * 250);
    const makeReq = () =>
      new Request("http://localhost/api/test", {
        headers: { "x-real-ip": uniqueIp },
      });

    const config = { maxRequests: 3, windowMs: 10_000 };

    const res1 = checkRateLimit(makeReq(), config);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(makeReq(), config);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(makeReq(), config);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    const res4 = checkRateLimit(makeReq(), config);
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);

    const response = createRateLimitResponse(res4);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(response.headers.get("X-RateLimit-Limit")).toBe("3");
  });
});

describe("models dynamic resolution", () => {
  it("resolves model profile dynamically", () => {
    const fastProfile = getModelProfile("fast");
    expect(fastProfile).toBeDefined();
    expect(fastProfile.name).toBeTruthy();
    expect(typeof fastProfile.temperature).toBe("number");

    // Dynamic proxy check
    expect(MODEL_PROFILES.fast.name).toBe(fastProfile.name);
    expect(MODEL_PROFILES.standard.temperature).toBeDefined();
    expect(MODEL_PROFILES.reasoning.maxTokens).toBeDefined();
  });
});
