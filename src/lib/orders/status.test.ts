import { describe, expect, it } from "vitest";
import { toOrderStatus } from "./status";

describe("toOrderStatus", () => {
  it.each([
    ["approved", "accredited", "paid"],
    ["pending", "pending_waiting_transfer", "pending"],
    ["in_process", "pending_review_manual", "pending"],
    ["rejected", "cc_rejected_other_reason", "rejected"],
    ["cancelled", "expired", "expired"],
    ["cancelled", "by_collector", "cancelled"],
    ["charged_back", "settled", "refunded"],
  ] as const)("maps %s/%s to %s", (status, statusDetail, expected) => {
    expect(toOrderStatus({ status, status_detail: statusDetail })).toBe(expected);
  });
});
