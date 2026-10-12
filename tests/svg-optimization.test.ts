import { expect, test } from "vitest";
import { optimizeShieldSvg } from "../scripts/shared/svg-optimization.js";

test("SVG optimization preserves author, license, comments, title, description, and viewBox", () => {
  const source = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Author: Test Artist; License: CC BY 4.0 -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" width="10" height="10" viewBox="0 0 10 10">
  <title>Example shield title</title>
  <desc>Attribution preservation fixture</desc>
  <metadata><rdf:RDF><cc:License rdf:about="https://creativecommons.org/licenses/by/4.0/"><dc:creator>Test Artist</dc:creator><dc:rights>CC BY 4.0</dc:rights></cc:License></rdf:RDF></metadata>
  <rect width="10" height="10" fill="#000"/>
</svg>`;

  const optimized = optimizeShieldSvg(source, "raw/svg/example.svg");

  expect(optimized).toContain("Author: Test Artist; License: CC BY 4.0");
  expect(optimized).toContain("rdf:RDF");
  expect(optimized).toContain("cc:License");
  expect(optimized).toContain("https://creativecommons.org/licenses/by/4.0/");
  expect(optimized).toContain("Test Artist");
  expect(optimized).toContain("<title>Example shield title</title>");
  expect(optimized).toContain("<desc>Attribution preservation fixture</desc>");
  expect(optimized).toContain('viewBox="0 0 10 10"');
  expect(optimized).not.toContain('width="10"');
  expect(optimized).not.toContain('height="10"');
});
