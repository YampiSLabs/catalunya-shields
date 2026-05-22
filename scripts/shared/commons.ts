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

export const searchCommonsFiles = async (query: string) => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const text = await response.text();
  const data = parseCommonsJson(text);

  if (data.error) {
    console.error("API error:", data.error);
    throw new Error("API returned error");
  }

  return data.query.search;
};

export const getImageUrl = async (title: string) => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(title)}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const text = await response.text();
  const data = parseCommonsJson(text);

  const pages = Object.values(data.query.pages) as any[];
  return pages[0]?.imageinfo?.[0]?.url;
};

export const downloadFile = async (url: string, outputPath: string) => {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Failed to download ${url}`);
  const text = await response.text();

  // Validate it's an SVG
  if (!text.trim().startsWith("<svg") && !text.trim().startsWith("<?xml")) {
    throw new Error(
      `Downloaded file is not a valid SVG: ${text.substring(0, 50)}...`,
    );
  }

  require("fs").writeFileSync(outputPath, text);
};
