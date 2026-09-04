import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});

afterAll(() => server.close());
