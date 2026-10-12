import { getShieldPaths } from "./shield-paths.js";

export type MunicipalityImageSource = {
  name: string;
  slug: string;
  province?: string;
};

export type MissingShieldEntry = {
  slug: string;
  name: string;
  province?: string;
  rawSvgPath: string;
  assetSvgPath: string;
  candidatePath: string;
  rawSvgPresent: boolean;
  nextStep: "optimize-existing-raw" | "find-reviewed-commons-svg";
};

export type MissingShieldDictionary = {
  schemaVersion: 1;
  source: "data/municipalities.json";
  municipalityCount: number;
  downloadedCount: number;
  missingCount: number;
  candidateFilesAreAdvisory: true;
  missingBySlug: Record<string, MissingShieldEntry>;
};

export const buildMissingShieldDictionary = (
  municipalities: MunicipalityImageSource[],
  presentAssetSlugs: ReadonlySet<string>,
  presentRawSlugs: ReadonlySet<string>,
): MissingShieldDictionary => {
  const seenSlugs = new Set<string>();
  const missingBySlug: Record<string, MissingShieldEntry> = {};

  for (const municipality of municipalities) {
    const { slug } = municipality;
    const paths = getShieldPaths(slug);
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate municipality slug: ${slug}`);
    }
    seenSlugs.add(slug);

    if (presentAssetSlugs.has(slug)) continue;

    const rawSvgPresent = presentRawSlugs.has(slug);
    missingBySlug[slug] = {
      slug,
      name: municipality.name,
      ...(municipality.province ? { province: municipality.province } : {}),
      rawSvgPath: paths.rawSvg,
      assetSvgPath: paths.optimizedSvg,
      candidatePath: paths.candidateJson,
      rawSvgPresent,
      nextStep: rawSvgPresent
        ? "optimize-existing-raw"
        : "find-reviewed-commons-svg",
    };
  }

  const missingCount = Object.keys(missingBySlug).length;
  return {
    schemaVersion: 1,
    source: "data/municipalities.json",
    municipalityCount: municipalities.length,
    downloadedCount: municipalities.length - missingCount,
    missingCount,
    candidateFilesAreAdvisory: true,
    missingBySlug,
  };
};
