import { expect, test } from "vitest";
import { scoreCandidate } from "../scripts/shared/candidates.js";

test("candidate scoring", () => {
  const file1 = { title: "Escut de Barcelona.svg", mime: "image/svg+xml" };
  expect(scoreCandidate(file1, "Barcelona").confidence).toBe("high");

  const file2 = { title: "Flag of Barcelona.svg", mime: "image/svg+xml" };
  expect(scoreCandidate(file2, "Barcelona").confidence).not.toBe("high");
});

test("only exact municipal SVG titles receive high confidence", () => {
  expect(
    scoreCandidate(
      { title: "File:Escut d'Agramunt.svg" },
      "Agramunt",
    ).confidence,
  ).toBe("high");
  expect(
    scoreCandidate(
      { title: "File:Escut de Puigverd d'Agramunt.svg" },
      "Agramunt",
    ).confidence,
  ).toBe("medium");
  expect(
    scoreCandidate({ title: "File:Escut de Campos.svg" }, "Artés").confidence,
  ).toBe("medium");
  expect(
    scoreCandidate({ title: "File:Escudo de Abrera.jpg" }, "Abrera").confidence,
  ).not.toBe("high");
});

test("Spanish and English municipal shield titles are recognized", () => {
  expect(
    scoreCandidate(
      { title: "File:Escudo de Abrera (Barcelona).svg" },
      "Abrera",
    ).confidence,
  ).toBe("high");
  expect(
    scoreCandidate(
      { title: "File:Coat of arms of Cornellà de Llobregat.svg" },
      "Cornellà de Llobregat",
    ).confidence,
  ).toBe("high");
});

test("Val d'Aran es-names match their Catalan heraldic article", () => {
  expect(
    scoreCandidate(
      { title: "File:Escut de les Bòrdes.svg" },
      "Es Bòrdes",
    ).confidence,
  ).toBe("high");
});

test("historic and provincial variants are not auto-approved", () => {
  expect(
    scoreCandidate(
      { title: "File:Escut de Baix Pallars (2009-2022).svg" },
      "Baix Pallars",
    ).confidence,
  ).not.toBe("high");
  expect(
    scoreCandidate(
      { title: "File:Escut de la provincia de Girona.svg" },
      "Girona",
    ).confidence,
  ).not.toBe("high");
});
