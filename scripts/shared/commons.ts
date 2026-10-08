export class WikimediaRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WikimediaRateLimitError";
  }
}

const USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ||
  "catalunya-shields/0.1 educational open-source package";

const parseCommonsJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    console.error("API response error:", text);
    if (text.toLowerCase().includes("too many requests")) {
      throw new WikimediaRateLimitError(
        "Wikimedia API rate limit reached; stopping this run cleanly",
      );
    }
    throw new Error("API returned non-JSON response");
  }
};

type DownloadFileOptions = {
  retries?: number;
  retryDelayMs?: number;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeSearchQuery = (query: string) =>
  query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const buildCommonsSearchQueries = (municipalityName: string) => {
  const name = municipalityName.trim();
  const catalanQueries: string[] = [];

  if (/^el\s+/i.test(name)) {
    const rest = name.replace(/^el\s+/i, "");
    catalanQueries.push(`Escut del ${rest}`, `Escut de ${name}`);
  } else if (/^els\s+/i.test(name)) {
    const rest = name.replace(/^els\s+/i, "");
    catalanQueries.push(`Escut dels ${rest}`, `Escut de ${name}`);
  } else if (/^es\s+/i.test(name)) {
    const rest = name.replace(/^es\s+/i, "");
    catalanQueries.push(
      `Escut d'es ${rest}`,
      `Escut de les ${rest}`,
      `Escut de ${name}`,
    );
  } else if (/^l['’]/i.test(name)) {
    catalanQueries.push(`Escut de ${name}`, `Escut d'${name.slice(2)}`);
  } else if (/^[aeiouàèéíïòóúü]/i.test(name)) {
    catalanQueries.push(`Escut d'${name}`, `Escut de ${name}`);
  } else {
    catalanQueries.push(`Escut de ${name}`);
  }

  const queries = [
    ...catalanQueries,
    `Escudo de ${name}`,
    `coat of arms of ${name}`,
  ];
  const seen = new Set<string>();

  return queries.filter((query) => {
    const normalized = normalizeSearchQuery(query);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

export const searchCommonsFiles = async (query: string) => {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    srsearch: `intitle:${query}`,
    srnamespace: "6",
    srlimit: "20",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const text = await response.text();
  const data = parseCommonsJson(text);

  if (data.error) {
    console.error("API error:", data.error);
    throw new Error("API returned error");
  }

  return data.query?.search ?? [];
};

export const getImageUrl = async (title: string) => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(title)}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const text = await response.text();
  const data = parseCommonsJson(text);

  const pages = Object.values(data.query.pages) as any[];
  return pages[0]?.imageinfo?.[0]?.url;
};

export const downloadFile = async (
  url: string,
  outputPath: string,
  options: DownloadFileOptions = {},
) => {
  const retries =
    options.retries ?? parseInt(process.env.WIKIMEDIA_DOWNLOAD_RETRIES || "3");
  const retryDelayMs =
    options.retryDelayMs ??
    parseInt(process.env.WIKIMEDIA_DOWNLOAD_RETRY_DELAY_MS || "2000");

  let response: Response | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) break;

      lastError = new Error(
        `Failed to download ${url}: HTTP ${response.status} ${response.statusText}`,
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      console.warn(
        `Download failed for ${url}; retrying (${attempt + 1}/${retries})`,
      );
      await delay(retryDelayMs);
    }
  }

  if (!response?.ok) {
    if (lastError instanceof Error) throw lastError;
    throw new Error(`Failed to download ${url}`);
  }

  const text = await response.text();

  // Validate it's an SVG
  if (!text.trim().startsWith("<svg") && !text.trim().startsWith("<?xml")) {
    throw new Error(
      `Downloaded file is not a valid SVG: ${text.substring(0, 50)}...`,
    );
  }

  require("fs").writeFileSync(outputPath, text);
};
