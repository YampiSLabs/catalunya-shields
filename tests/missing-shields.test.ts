import { expect, test } from "vitest";
import { buildMissingShieldDictionary } from "../scripts/shared/missing-shields.js";
import { getShieldPaths } from "../scripts/shared/shield-paths.js";

test("missing-shield dictionary gives each municipality exact paths and next step", () => {
  const slug = "castell-daro-platja-daro-i-sagaro";
  const dictionary = buildMissingShieldDictionary(
    [
      {
        name: "Castell d'Aro, Platja d'Aro i s'Agaró",
        slug,
        province: "Girona",
      },
      { name: "Agramunt", slug: "agramunt", province: "Lleida" },
    ],
    new Set(["agramunt"]),
    new Set([slug]),
  );

  expect(dictionary).toMatchObject({
    schemaVersion: 1,
    source: "data/municipalities.json",
    municipalityCount: 2,
    downloadedCount: 1,
    missingCount: 1,
    candidateFilesAreAdvisory: true,
  });
  expect(dictionary.missingBySlug[slug]).toEqual({
    slug,
    name: "Castell d'Aro, Platja d'Aro i s'Agaró",
    province: "Girona",
    rawSvgPath: `raw/svg/${slug}.svg`,
    assetSvgPath: `assets/svg/${slug}.svg`,
    candidatePath: `data/commons-candidates/${slug}.json`,
    rawSvgPresent: true,
    nextStep: "optimize-existing-raw",
  });
});

test("shield paths reject invalid slugs and keep exact ASCII filenames", () => {
  expect(() => getShieldPaths("bad/slug")).toThrow("Invalid municipality slug");
  expect(getShieldPaths("vilafranca-del-penedes").optimizedSvg).toBe(
    "assets/svg/vilafranca-del-penedes.svg",
  );
});

test("missing-shield dictionary rejects duplicate official slugs", () => {
  expect(() =>
    buildMissingShieldDictionary(
      [
        { name: "A", slug: "a" },
        { name: "A duplicate", slug: "a" },
      ],
      new Set(),
      new Set(),
    ),
  ).toThrow("Duplicate municipality slug");
});
