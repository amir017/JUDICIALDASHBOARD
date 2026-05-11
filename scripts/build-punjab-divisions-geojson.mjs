/**
 * Rebuild Punjab map GeoJSON: one polygon per ADM3 district, tagged with its division.
 *
 * We avoid turf.union on adjacent districts — that produced multi-ring polygons that
 * confused d3-geo’s clipper (spurious full-viewport path segments, “stacked” divisions).
 *
 * Source: PakData/GISData PAK_adm3.json (GADM-based).
 * Run: node scripts/build-punjab-divisions-geojson.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const geoDir = path.join(root, "public", "geo");
const dataDir = path.join(root, "src", "data");

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

const adm3Url = "https://raw.githubusercontent.com/PakData/GISData/master/PAK-GeoJSON/PAK_adm3.json";
const adm3Path = path.join(geoDir, "_build_PAK_adm3.json");

await download(adm3Url, adm3Path);
const adm3 = JSON.parse(fs.readFileSync(adm3Path, "utf8"));

/** Lowercase key for matching PakData NAME_3 (keep trailing “1/2” splits — do not strip digits). */
function normDistrictKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Wikipedia-style division → districts.
 * Use real-world district names where possible; `DISTRICT_SYNONYMS` maps them to PakData NAME_3 keys.
 */
const DIVISION_TO_DISTRICTS = {
  Lahore: ["Lahore", "Kasur", "Sheikhupura", "Nankana Sahib"],
  Rawalpindi: ["Rawalpindi", "Attock", "Jhelum", "Chakwal"],
  // Chiniot is absent from this PakData ADM3 extract (older boundaries); Jhang polygon still covers most of the division footprint.
  Faisalabad: ["Faisalabad", "Jhang", "Toba Tek Singh"],
  Multan: ["Multan", "Khanewal", "Lodhran", "Vehari"],
  // PakData splits these into “1 / 2” parts — include every piece so the division footprint is complete.
  Gujranwala: ["Gujranwala 1", "Gujranwala 2", "Sialkot", "Narowal 1", "Narowal 2"],
  // NAME_3 “Gujarat” in this dataset corresponds to Mandi Bahauddin (common upstream typo).
  Gujrat: ["Gujrat", "Mandi Bahauddin", "Hafizabad"],
  Sargodha: ["Sargodha", "Khushab", "Mianwali", "Bhakkar"],
  Bahawalpur: ["Bahawalpur", "Bahawalnagar", "Rahim Yar Khan"],
  "Dera Ghazi Khan": ["Dera Ghazi Khan", "Rajanpur", "Muzaffargarh", "Layyah"],
  Sahiwal: ["Sahiwal", "Okara", "Okara 1", "Pakpattan"],
};

/** Canonical / Wikipedia spellings → PakData NAME_3 key after normName(). */
const DISTRICT_SYNONYMS = {
  attock: "attok",
  "mandi bahauddin": "gujarat",
  "rahim yar khan": "rahimyar khan",
  "dera ghazi khan": "dera ghazi kha",
  rajanpur: "rajan pur",
};

const punjabDistricts = adm3.features.filter((f) => f?.properties?.NAME_1 === "Punjab");

const byDistrict = new Map();
for (const f of punjabDistricts) {
  const n = normDistrictKey(f?.properties?.NAME_3);
  if (!n) continue;
  if (!byDistrict.has(n)) byDistrict.set(n, f);
}

function adm3KeyForDistrictLabel(districtLabel) {
  const k = normDistrictKey(districtLabel);
  return DISTRICT_SYNONYMS[k] || k;
}

const features = [];
const missing = [];

for (const [division, districts] of Object.entries(DIVISION_TO_DISTRICTS)) {
  for (const d of districts) {
    const key = adm3KeyForDistrictLabel(d);
    const src = byDistrict.get(key);
    if (!src) {
      missing.push({ division, district: d });
      continue;
    }
    features.push({
      type: "Feature",
      properties: {
        division,
        district: String(src.properties.NAME_3 || d).trim(),
        name_3: src.properties.NAME_3,
        gid_3: src.properties.GID_3,
        source: "adm3",
      },
      geometry: src.geometry,
    });
  }
}

if (missing.length) {
  console.warn(
    "Missing districts (skipped):",
    missing.map((m) => `${m.district} (${m.division})`).join(", "),
  );
}

if (features.length < 30) {
  throw new Error(`Expected most Punjab division districts, got only ${features.length} features`);
}

const fc = {
  type: "FeatureCollection",
  name: "punjab_division_districts",
  features,
};

const outJson = JSON.stringify(fc);
fs.writeFileSync(path.join(geoDir, "punjab_divisions.geojson"), outJson);
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "punjab_divisions.json"), outJson);
fs.unlinkSync(adm3Path);

const divs = [...new Set(features.map((f) => f.properties.division))].sort();
console.log(
  "Wrote punjab_divisions.geojson + src/data/punjab_divisions.json with",
  fc.features.length,
  "district polygons across",
  divs.length,
  "divisions:",
  divs.join(", "),
);
