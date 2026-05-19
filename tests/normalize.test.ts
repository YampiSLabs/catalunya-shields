import { expect, test } from "vitest";
import {
  createSlug,
  createComponentName,
  normalizeSearchText,
} from "../scripts/shared/text.js";

test("slug generation", () => {
  expect(createSlug("Mataró")).toBe("mataro");
  expect(createSlug("Rubí")).toBe("rubi");
  expect(createSlug("L'Hospitalet de Llobregat")).toBe(
    "lhospitalet-de-llobregat",
  );
});

test("component name", () => {
  expect(createComponentName("L'Hospitalet de Llobregat")).toBe(
    "LHospitaletDeLlobregat",
  );
});

test("search key", () => {
  expect(normalizeSearchText("Sant Cugat del Vallès")).toBe(
    "sant cugat del valles",
  );
});
