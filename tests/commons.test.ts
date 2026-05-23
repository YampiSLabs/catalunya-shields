import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, expect, test, vi } from "vitest";
import { downloadFile } from "../scripts/shared/commons.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

test("downloadFile retries transient failed responses before writing SVG", async () => {
  const dir = mkdtempSync(join(tmpdir(), "catalunya-shields-"));
  const outputPath = join(dir, "shield.svg");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => "temporary upstream failure",
    })
    .mockResolvedValueOnce({
      ok: true,
      text: async () => "<svg></svg>",
    });

  globalThis.fetch = fetchMock as unknown as typeof fetch;

  try {
    await downloadFile("https://example.test/shield.svg", outputPath, {
      retries: 1,
      retryDelayMs: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readFileSync(outputPath, "utf8")).toBe("<svg></svg>");
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
