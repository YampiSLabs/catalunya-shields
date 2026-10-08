import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, expect, test, vi } from "vitest";
import {
  buildCommonsSearchQueries,
  downloadFile,
  searchCommonsFiles,
} from "../scripts/shared/commons.js";

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

test("Commons query fallback includes Catalan contractions and other naming conventions", () => {
  expect(buildCommonsSearchQueries("Abrera")).toEqual([
    "Escut d'Abrera",
    "Escut de Abrera",
    "Escudo de Abrera",
    "coat of arms of Abrera",
  ]);
  expect(buildCommonsSearchQueries("Artés")[0]).toBe("Escut d'Artés");
  expect(buildCommonsSearchQueries("el Bruc")[0]).toBe("Escut del Bruc");
  expect(buildCommonsSearchQueries("Es Bòrdes")).toContain(
    "Escut de les Bòrdes",
  );
});

test("Commons search scopes to titles with intitle instead of disabled srwhat", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify({ query: { search: [{ title: "File:Escut de Abrera.svg" }] } }),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  await expect(searchCommonsFiles("Escut de Abrera")).resolves.toEqual([
    { title: "File:Escut de Abrera.svg" },
  ]);

  const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);
  expect(requestUrl.searchParams.get("srsearch")).toBe(
    "intitle:Escut de Abrera",
  );
  expect(requestUrl.searchParams.has("srwhat")).toBe(false);
});
