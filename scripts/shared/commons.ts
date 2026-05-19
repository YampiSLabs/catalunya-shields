const USER_AGENT = "catalunya-shields/0.1 educational open-source package";

export const searchCommonsFiles = async (query: string) => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const text = await response.text();
  
  try {
    const data = JSON.parse(text);
    if (data.error) {
      console.error("API error:", data.error);
      throw new Error("API returned error");
    }
    return data.query.search;
  } catch (e) {
    console.error("API response error:", text);
    throw new Error("API returned non-JSON response (likely rate-limited)");
  }
};

export const getImageUrl = async (title: string) => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(title)}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const text = await response.text();
  
  try {
    const data = JSON.parse(text);
    const pages = Object.values(data.query.pages) as any[];
    return pages[0]?.imageinfo?.[0]?.url;
  } catch (e) {
    console.error("API response error:", text);
    throw new Error("API returned non-JSON response (likely rate-limited)");
  }
};

export const downloadFile = async (url: string, outputPath: string) => {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Failed to download ${url}`);
  const text = await response.text();
  
  // Validate it's an SVG
  if (!text.trim().startsWith('<svg') && !text.trim().startsWith('<?xml')) {
    throw new Error(`Downloaded file is not a valid SVG: ${text.substring(0, 50)}...`);
  }

  require('fs').writeFileSync(outputPath, text);
};
