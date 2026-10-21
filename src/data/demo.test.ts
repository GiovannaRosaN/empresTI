import { describe, expect, it } from "vitest";
import { equipment, filterEquipment } from "./demo";

describe("filterEquipment", () => {
  it("finds equipment by name or asset tag without case sensitivity", () => {
    expect(filterEquipment(equipment, "thinkpad", "all")).toHaveLength(2);
    expect(filterEquipment(equipment, "pat-0233", "all")[0]?.name).toBe("Sony A7 III");
  });

  it("combines category and availability filters", () => {
    const results = filterEquipment(equipment, "", "notebook", true);
    expect(results.map((item) => item.assetTag)).toEqual(["PAT-1188", "PAT-1204"]);
  });
});