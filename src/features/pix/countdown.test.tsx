import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Countdown, formatRemaining } from "./countdown";

describe("formatRemaining", () => {
  it("formats milliseconds as mm:ss rounding up", () => {
    expect(formatRemaining(30 * 60 * 1000)).toBe("30:00");
    expect(formatRemaining(61_500)).toBe("01:02");
    expect(formatRemaining(-1000)).toBe("00:00");
  });
});

describe("Countdown", () => {
  it("ticks every second and shows when the code expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T21:00:00.000Z"));
    render(<Countdown expiresAt="2026-10-21T21:00:02.000Z" />);

    expect(screen.getByText("00:02")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("00:01")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("Código expirado")).toBeInTheDocument();
  });
});
