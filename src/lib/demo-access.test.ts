import { afterEach, describe, expect, it } from "vitest";
import { isDemoAccessEnabled } from "./demo-access";

const originalValue = process.env.DEMO_ACCESS_ENABLED;

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env.DEMO_ACCESS_ENABLED;
  } else {
    process.env.DEMO_ACCESS_ENABLED = originalValue;
  }
});

describe("isDemoAccessEnabled", () => {
  it("enables public demo access by default", () => {
    delete process.env.DEMO_ACCESS_ENABLED;

    expect(isDemoAccessEnabled()).toBe(true);
  });

  it("can be disabled explicitly", () => {
    process.env.DEMO_ACCESS_ENABLED = "false";

    expect(isDemoAccessEnabled()).toBe(false);
  });
});
