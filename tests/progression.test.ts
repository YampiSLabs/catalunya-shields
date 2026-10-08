import { expect, test } from "vitest";
import { selectRotatingBatch } from "../scripts/shared/progression.js";

test("review batches rotate deterministically across days", () => {
  const municipalities = Array.from({ length: 21 }, (_, index) => index);
  const dayOne = new Date("2026-10-08T00:00:00.000Z");
  const dayTwo = new Date("2026-10-09T00:00:00.000Z");

  const first = selectRotatingBatch(municipalities, 5, dayOne);
  const sameDay = selectRotatingBatch(municipalities, 5, dayOne);
  const second = selectRotatingBatch(municipalities, 5, dayTwo);

  expect(first).toEqual(sameDay);
  expect(first.items).not.toEqual(second.items);
  expect(new Set([...first.items, ...second.items]).size).toBe(10);
});

test("rotation handles empty input and clamps batch size", () => {
  expect(selectRotatingBatch([], 10)).toEqual({ items: [], startIndex: 0 });
  expect(selectRotatingBatch(["one", "two"], 10).items).toEqual([
    "one",
    "two",
  ]);
});
