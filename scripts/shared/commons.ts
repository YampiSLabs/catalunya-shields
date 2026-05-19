const USER_AGENT = "catalunya-shields/0.1 educational open-source package";

export const searchCommonsFiles = async (query: string) => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const data = await response.json();
  return data.query.search;
};

export const getCommonsFileMetadata = async (title: string) => {
  // Simplified for this stage
  return { title };
};

export const downloadFile = async (url: string, outputPath: string) => {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const buffer = await response.arrayBuffer();
  require('fs').writeFileSync(outputPath, Buffer.from(buffer));
};
