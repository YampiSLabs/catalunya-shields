import { writeJson } from "./shared/fs.js";

const query = `
SELECT ?municipality ?municipalityLabel ?provinceLabel WHERE {
  ?municipality wdt:P31 wd:Q33146843.
  OPTIONAL {
    ?municipality wdt:P131* ?province .
    ?province wdt:P31 wd:Q162620 .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ca,es,en". }
} ORDER BY ?municipalityLabel
`;

const USER_AGENT = "catalunya-shields/0.1 educational open-source package";

async function run() {
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`;
  console.log("Fetching from Wikidata...");
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json"
    }
  });

  const data = await response.json() as any;
  const results = data.results.bindings;
  console.log(`Fetched ${results.length} municipalities.`);

  const list: any[] = [];
  for (const b of results) {
    const name = b.municipalityLabel.value;
    let province = b.provinceLabel?.value || "";

    if (!province) {
      if (name === "Riells i Viabrea") {
        province = "Girona";
      } else {
        console.log(`Missing province for: ${name} (${b.municipality.value})`);
        continue;
      }
    }

    // Clean province name
    let prov = province.replace("Província de ", "").replace("província de ", "");
    prov = prov.charAt(0).toUpperCase() + prov.slice(1);

    list.push({
      name,
      province: prov
    });
  }

  // Let's write them!
  console.log(`Writing ${list.length} municipalities to data/municipalities.raw.json...`);
  writeJson("data/municipalities.raw.json", list);
  console.log("Done!");
}

run().catch(console.error);
