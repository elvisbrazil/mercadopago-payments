import { describe, expect, it } from "vitest";
import { amountToCents, centsToAmount, formatBRL } from "./money";

describe("formatBRL", () => {
  it("formats cents as Brazilian reais", () => {
    expect(formatBRL(4890)).toBe("R$ 48,90");
  });

  it("uses dot as thousands separator", () => {
    expect(formatBRL(123456789)).toBe("R$ 1.234.567,89");
  });

  it("formats zero and single cents", () => {
    expect(formatBRL(0)).toBe("R$ 0,00");
    expect(formatBRL(7)).toBe("R$ 0,07");
  });
});

describe("amount conversion", () => {
  it("converts cents to the decimal amount the API expects", () => {
    expect(centsToAmount(18950)).toBe(189.5);
  });

  it("rounds floating point noise when converting back to cents", () => {
    expect(amountToCents(0.1 + 0.2)).toBe(30);
    expect(amountToCents(19.99)).toBe(1999);
  });
});
