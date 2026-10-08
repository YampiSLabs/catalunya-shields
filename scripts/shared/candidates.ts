export type ScoredCandidate = {
  title: string;
  score: number;
  confidence: "high" | "medium" | "low";
  isSvg: boolean;
  matchesMunicipality: boolean;
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const hasMunicipalityPrefix = (title: string, municipalityName: string) => {
  const municipality = normalizeText(municipalityName);
  if (!municipality) return false;

  const forms = new Set([municipality]);
  const articleMatch = municipality.match(/^(?:el|els|la|les|l|es) (.+)$/);
  if (articleMatch) {
    forms.add(articleMatch[1]);
    if (municipality.startsWith("es ")) forms.add(`les ${articleMatch[1]}`);
  }

  const normalizedTitle = normalizeText(
    title.replace(/^File:/i, "").replace(/\.svg$/i, ""),
  );
  const heraldicTerms = ["escut", "escudo", "escudo de armas", "coat of arms", "arms"];
  const connectors = ["", "de ", "d ", "del ", "dels ", "de la ", "de les ", "de l ", "of ", "of the "];

  for (const term of heraldicTerms) {
    for (const connector of connectors) {
      for (const form of forms) {
        const prefix = normalizeText(`${term} ${connector}${form}`);
        if (
          normalizedTitle === prefix ||
          normalizedTitle.startsWith(`${prefix} `)
        ) {
          return true;
        }
      }
    }
  }

  return false;
};

export const scoreCandidate = (
  file: { title: string; mime?: string },
  municipalityName: string,
): ScoredCandidate => {
  const title = normalizeText(file.title.replace(/^File:/i, ""));
  const isSvg = /\.svg$/i.test(file.title);
  const matchesMunicipality = hasMunicipalityPrefix(
    file.title,
    municipalityName,
  );
  const hasHeraldicTerm = /^(?:escut|escudo|coat of arms|arms)\b/.test(title);
  const isFlag = /\b(?:flag|bandera)\b/.test(title);
  const isHistorical =
    /\b(?:antic|antiga|anterior|old|former|historic|historical)\b/.test(title) ||
    /\b(?:18|19|20)\d{2} \s*(?:to|a|al)?\s*(?:18|19|20)\d{2}\b/.test(title);

  let score = 0;
  if (isSvg) score += 70;
  if (hasHeraldicTerm) score += 50;
  if (matchesMunicipality) score += 40;
  if (isFlag) score -= 100;
  if (isHistorical) score -= 40;

  const isSafeHighConfidence =
    isSvg && hasHeraldicTerm && matchesMunicipality && !isFlag && !isHistorical;
  const confidence = isSafeHighConfidence
    ? "high"
    : score >= 70
      ? "medium"
      : "low";

  return {
    title: file.title,
    score,
    confidence,
    isSvg,
    matchesMunicipality,
  };
};
