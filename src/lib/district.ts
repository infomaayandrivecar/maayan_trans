/**
 * District resolution for booking IDs.
 *
 * A booking ID embeds the pickup district as a 3-letter code
 * (MYN-CBE-DDMMYY-HHMM-SEQ). Deriving that district by searching the address
 * text is unreliable: roads, schools and landmarks are routinely named after
 * other cities, so "Trichy Road, Sowripalayam Pirivu, Ramanathapuram" — an
 * address in Coimbatore — reads as Tiruchirappalli to a substring match.
 *
 * The district therefore comes from Google's structured address components,
 * and only falls back to text when those are unavailable.
 */

/** A Google Maps address component. */
export interface AddressComponent {
  long_name: string;
  short_name?: string;
  types: string[];
}

/**
 * Picks the administrative district out of Google's address components.
 *
 * Indian districts land on different levels depending on the state:
 * Tamil Nadu puts them on administrative_area_level_3, most other states use
 * level_2. Locality is the last resort — it is often a neighbourhood
 * (e.g. "Ramanathapuram" inside Coimbatore) rather than a district.
 */
export function extractDistrict(components?: AddressComponent[] | null): string {
  if (!Array.isArray(components) || components.length === 0) return "";

  const pick = (type: string): string => {
    const hit = components.find((c) => Array.isArray(c?.types) && c.types.includes(type));
    return hit?.long_name?.trim() || "";
  };

  return (
    pick("administrative_area_level_3") ||
    pick("administrative_area_level_2") ||
    pick("locality") ||
    pick("administrative_area_level_1") ||
    ""
  );
}

/**
 * District/city name to 3-letter code. Keys are matched against a resolved
 * district name, not a whole address, so they can stay short.
 */
const DISTRICT_CODES: Record<string, string> = {
  // Tamil Nadu
  chennai: "CHE", coimbatore: "CBE", madurai: "MDU",
  tiruchirappalli: "TRZ", trichy: "TRZ", tiruchchirappalli: "TRZ",
  salem: "SLM", erode: "ERD", tirupur: "TUP", tiruppur: "TUP",
  tirunelveli: "TNV", tenkasi: "TSI",
  thoothukudi: "TCR", tuticorin: "TCR",
  kanyakumari: "KKM", nagercoil: "KKM",
  vellore: "VLR", ranipet: "RPT", tirupattur: "TPR",
  tiruvannamalai: "TVM", viluppuram: "VPM", villupuram: "VPM",
  kallakurichi: "KLR", cuddalore: "CDL",
  mayiladuthurai: "MYD", nagapattinam: "NGP",
  thanjavur: "TNJ", tanjore: "TNJ", kumbakonam: "KUM",
  tiruvarur: "TVR", perambalur: "PBL", ariyalur: "ARL",
  namakkal: "NMK", karur: "KRR", dindigul: "DIG", theni: "THN",
  sivaganga: "SVG", sivagangai: "SVG", karaikudi: "KKD",
  ramanathapuram: "RMD", virudhunagar: "VNR", srivilliputhur: "SVP",
  krishnagiri: "KGI", hosur: "HSR", dharmapuri: "DPI",
  nilgiris: "OTY", "the nilgiris": "OTY", ooty: "OTY", udhagamandalam: "OTY",
  tiruvallur: "TVL", thiruvallur: "TVL",
  chengalpattu: "CGP", mahabalipuram: "MBM", kancheepuram: "KAN", kanchipuram: "KAN",
  pudukkottai: "PDK",

  // Kerala
  thiruvananthapuram: "TRV", trivandrum: "TRV", kovalam: "KVL",
  kollam: "KLM", pathanamthitta: "PTA",
  alappuzha: "ALP", alleppey: "ALP",
  kottayam: "KTM", kumarakom: "KMR",
  idukki: "IDK", munnar: "MNR", thekkady: "TKD",
  ernakulam: "EKM", kochi: "COK", cochin: "COK",
  thrissur: "TSR", guruvayur: "GVR", palakkad: "PKD",
  malappuram: "MLP", kozhikode: "CCJ", calicut: "CCJ",
  wayanad: "WYD", "sulthan bathery": "SBY",
  kannur: "CNN", thalassery: "TLS", kasaragod: "KSD", bekal: "BKL",

  // Karnataka
  bengaluru: "BLR", bangalore: "BLR",
  "bengaluru urban": "BLR", "bangalore urban": "BLR",
  "bengaluru rural": "BLR", "bangalore rural": "BLR",
  mysuru: "MYS", mysore: "MYS",
  mangaluru: "IXE", mangalore: "IXE", "dakshina kannada": "IXE",
  hubballi: "HBL", hubli: "HBL", "dharwad": "HBL",
  belagavi: "IXG", belgaum: "IXG",

  // Telangana / Andhra Pradesh
  hyderabad: "HYD", warangal: "WGL", karimnagar: "KNR", nizamabad: "NZB",
  visakhapatnam: "VTZ", vizag: "VTZ", vijayawada: "VGA",
  tirupati: "TIR", guntur: "GNT", kakinada: "KKN", nellore: "NLR",

  // Maharashtra
  mumbai: "BOM", bombay: "BOM", "mumbai city": "BOM", "mumbai suburban": "BOM",
  pune: "PNQ", nagpur: "NAG", nashik: "ISK",
  aurangabad: "IXU", "chhatrapati sambhajinagar": "IXU", kolhapur: "KLH",

  // Delhi NCR
  delhi: "DEL", "new delhi": "DEL", "central delhi": "DEL", "south delhi": "DEL",
  gurugram: "GGN", gurgaon: "GGN", faridabad: "FBD",
  "gautam buddha nagar": "NDA", noida: "NDA", ghaziabad: "GZB",

  // Rajasthan / Gujarat
  jaipur: "JAI", jodhpur: "JDH", udaipur: "UDR", kota: "KOT", ajmer: "AJM",
  ahmedabad: "AMD", surat: "STV", vadodara: "BDQ", baroda: "BDQ",
  rajkot: "RAJ", gandhinagar: "GNR",

  // East / North-East
  kolkata: "CCU", calcutta: "CCU", howrah: "HWH", durgapur: "DGP", siliguri: "IXB",
  bhubaneswar: "BBI", khordha: "BBI", cuttack: "CTC", rourkela: "RRK", puri: "PUR",
  guwahati: "GAU", "kamrup metropolitan": "GAU", shillong: "SHL",
  agartala: "IXA", imphal: "IMF", aizawl: "AJL", itanagar: "ITA",
  gangtok: "PYG", kohima: "DMU",

  // North / Central
  lucknow: "LKO", kanpur: "KNU", agra: "AGR", varanasi: "VNS",
  prayagraj: "IXD", allahabad: "IXD", meerut: "MRT",
  patna: "PAT", gaya: "GAY", muzaffarpur: "MZR",
  ranchi: "IXR", jamshedpur: "JSR", "east singhbhum": "JSR", dhanbad: "DHB",
  chandigarh: "IXC", amritsar: "ATQ", ludhiana: "LUH", jalandhar: "JUC",
  dehradun: "DED", haridwar: "HWD", rishikesh: "RSH",
  shimla: "SLV", manali: "MNL", kullu: "MNL", dharamshala: "DHM", kangra: "DHM",
  srinagar: "SXR", jammu: "IXJ",
  bhopal: "BHO", indore: "IDR", jabalpur: "JLR", gwalior: "GWL",
  raipur: "RPR", bilaspur: "BSP",

  // UTs
  goa: "GOI", panaji: "GOI", panjim: "GOI", "north goa": "GOI", "south goa": "GOI",
  pondicherry: "PNY", puducherry: "PNY",
};

/** Strips "District"/"Dist." suffixes and collapses whitespace. */
function normaliseDistrictName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(district|dist\.?|taluk|taluka|division|city|urban|rural)\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Maps a resolved district name to its 3-letter code. */
export function districtNameToCode(districtName: string): string {
  const cleaned = normaliseDistrictName(districtName);
  if (!cleaned) return "";

  if (DISTRICT_CODES[cleaned]) return DISTRICT_CODES[cleaned];

  // Try individual words, so "Coimbatore North" still resolves to CBE.
  for (const word of cleaned.split(" ")) {
    if (DISTRICT_CODES[word]) return DISTRICT_CODES[word];
  }

  // Unknown district: build a code from its letters rather than failing.
  const letters = cleaned.replace(/[^a-z]/g, "");
  if (!letters) return "";
  return letters.slice(0, 3).toUpperCase().padEnd(3, "X");
}

/**
 * Last-resort resolution from free address text, used only when structured
 * components are unavailable (older bookings, or a provider that returned none).
 *
 * Unlike a plain substring scan this walks the address from the most
 * district-like segment backwards, and ignores any segment that looks like a
 * street, so "Trichy Road" cannot masquerade as Tiruchirappalli.
 */
export function districtCodeFromAddressText(address: string): string {
  if (!address || typeof address !== "string") return "";

  const STREET_LIKE =
    /\b(road|rd|street|st|nagar|avenue|ave|lane|ln|highway|hwy|bypass|cross|main|colony|layout|extension|phase|block|sector|gate|junction|bridge|flyover|school|college|hospital|hotel|temple|church|mosque|mall|tower|complex|building|apartments?)\b/i;
  const NOISE =
    /^(india|tamil nadu|kerala|karnataka|andhra pradesh|telangana|maharashtra|goa|puducherry|delhi|\d{5,6}|)$/i;

  const segments = address
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !NOISE.test(s));

  // Google orders address text narrow -> broad, so the district sits near the
  // end. Walk backwards and take the first segment that maps to a known code.
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i].replace(/\b\d{5,6}\b/g, "").trim();
    if (!seg || STREET_LIKE.test(seg)) continue;
    const cleaned = normaliseDistrictName(seg);
    if (cleaned && DISTRICT_CODES[cleaned]) return DISTRICT_CODES[cleaned];
  }

  // No known district matched. Fall back to the broadest non-street segment.
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i].replace(/\b\d{5,6}\b/g, "").trim();
    if (!seg || STREET_LIKE.test(seg)) continue;
    const code = districtNameToCode(seg);
    if (code) return code;
  }

  return "";
}

/**
 * Resolves the 3-letter code for a booking ID.
 * Prefers the district captured from structured place data; only reads the
 * address text when that is missing.
 */
export function resolveDistrictCode(
  district: string | null | undefined,
  addressText: string | null | undefined
): string {
  const fromDistrict = district ? districtNameToCode(district) : "";
  if (fromDistrict) return fromDistrict;

  const fromText = addressText ? districtCodeFromAddressText(addressText) : "";
  if (fromText) return fromText;

  return "GEN";
}
