import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrderStatus } from "./use-order-status";

function statusResponse(status: string) {
  return Response.json({ id: "order-1", status });
}

describe("useOrderStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T22:00:00.000Z"));
  });

  it("polls until the order is paid and then stops", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(statusResponse("pending"))
      .mockResolvedValueOnce(statusResponse("pending"))
      .mockResolvedValueOnce(statusResponse("paid"));
    const { result } = renderHook(() =>
      useOrderStatus("order-1", "2026-09-14T22:30:00.000Z", 3000),
    );

    expect(result.current).toBe("pending");
    await act(() => vi.advanceTimersByTimeAsync(9000));

    expect(result.current).toBe("paid");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith("/api/orders/order-1", { cache: "no-store" });

    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("reports expired once the deadline passes without payment", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => statusResponse("pending"));
    const { result } = renderHook(() =>
      useOrderStatus("order-1", "2026-09-14T22:00:10.000Z", 3000),
    );

    await act(() => vi.advanceTimersByTimeAsync(9000));
    expect(result.current).toBe("pending");

    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(result.current).toBe("expired");

    const calls = fetchMock.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(fetchMock).toHaveBeenCalledTimes(calls);
  });

  it("keeps polling after a failed request", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(statusResponse("paid"));
    const { result } = renderHook(() =>
      useOrderStatus("order-1", "2026-09-14T22:30:00.000Z", 3000),
    );

    await act(() => vi.advanceTimersByTimeAsync(9000));

    expect(result.current).toBe("paid");
  });

  it("stops polling on unmount", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => statusResponse("pending"));
    const { unmount } = renderHook(() =>
      useOrderStatus("order-1", "2026-09-14T22:30:00.000Z", 3000),
    );

    await act(() => vi.advanceTimersByTimeAsync(3000));
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(30000));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
