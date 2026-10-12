const validMunicipalitySlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ShieldPaths = {
  rawSvg: string;
  optimizedSvg: string;
  candidateJson: string;
};

export const getShieldPaths = (slug: string): ShieldPaths => {
  if (!validMunicipalitySlug.test(slug)) {
    throw new Error(`Invalid municipality slug: ${slug}`);
  }

  return {
    rawSvg: `raw/svg/${slug}.svg`,
    optimizedSvg: `assets/svg/${slug}.svg`,
    candidateJson: `data/commons-candidates/${slug}.json`,
  };
};
