import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabaseClient";

const getSettingsPath = () => {
  return path.join(process.cwd(), "src", "data", "settings.json");
};

// Minimal hardcoded defaults (last resort fallback)
const defaultSettings = {
  company: {
    phone: "+91 98942 21664",
    email: "maayantransporters@gmail.com",
    address: "11-E, RKK Nagar, Singanallur, Coimbatore, Tamil Nadu, India",
    marqueeText: "✨ Welcome to Maayan Trans & Services! Premium Inter-City Travel, Airport Transfers, and Local Rides at Affordable Rates. ✨ | 📞 Call us at +91 98942 21664 to book your ride today! 📞 | ⭐ Safe, Vetted, and Professional Drivers for a Premium Experience. ⭐",
    notificationEmails: ["info.maayandrivecar@gmail.com"],
    gst: "",
    pan: "",
    minKmOneWay: 5,
    minKmRoundTrip: 5,
    minKmOutstation: 100
  },
  vehicles: {
    hatchback:     { ratePerKm: 13,   driverAllowancePerDay: 300, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 170, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
    sedan:         { ratePerKm: 14,   driverAllowancePerDay: 350, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 180, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
    premium_sedan: { ratePerKm: 16,   driverAllowancePerDay: 400, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 190, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
    suv:           { ratePerKm: 17.5, driverAllowancePerDay: 450, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 200, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
    premium_suv:   { ratePerKm: 20,   driverAllowancePerDay: 500, oneWayMinKmPerHour: 20, oneWayHourRate: 170, roundTripHourRate: 170, outstationHourRate: 210, outstationMinKmPerDay: 250, outstationHoursPerDay: 16 },
  }
};

/** Read settings.json from disk */
const loadLocalSettings = (): typeof defaultSettings => {
  try {
    const filePath = getSettingsPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read local settings.json:", e);
  }
  return defaultSettings;
};

/** Write settings to local settings.json */
const writeLocalSettings = (data: object) => {
  try {
    const filePath = getSettingsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e: any) {
    console.error("Failed to write local settings.json:", e.message || e);
  }
};

/** Upsert settings to Supabase */
const upsertToDatabase = async (data: { company: object; vehicles: object }): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("settings")
      .upsert({
        id: "current",
        company: data.company,
        vehicles: data.vehicles,
        updated_at: new Date().toISOString()
      });
    if (error) {
      console.error("Failed to upsert settings to Supabase:", error.message || error);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error("Supabase upsert exception:", e.message || e);
    return false;
  }
};

// ──────────────────────────────────────────────
// GET /api/settings          → return settings (DB is source of truth)
// GET /api/settings?sync=true → push settings.json → DB, then return
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    // ── Sync mode: push local settings.json → Supabase ──
    if (url.searchParams.get("sync") === "true") {
      const local = loadLocalSettings();
      const ok = await upsertToDatabase(local);
      if (ok) {
        return NextResponse.json({ success: true, message: "settings.json synced to database.", settings: local });
      } else {
        return NextResponse.json({ error: "Failed to sync settings.json to database." }, { status: 500 });
      }
    }

    // ── Normal GET: DB is source of truth ──
    const { data, error } = await supabase
      .from("settings")
      .select("company, vehicles")
      .eq("id", "current")
      .single();

    if (!error && data) {
      const mergedVehicles: Record<string, any> = {};
      const dbVehicles = (data.vehicles || {}) as Record<string, any>;
      for (const key of Object.keys(defaultSettings.vehicles)) {
        mergedVehicles[key] = {
          ...defaultSettings.vehicles[key as keyof typeof defaultSettings.vehicles],
          ...(dbVehicles[key] || {})
        };
      }
      return NextResponse.json({
        company: { ...defaultSettings.company, ...data.company },
        vehicles: mergedVehicles
      });
    }

    // Row missing in DB — seed it from local file
    if (error?.code === "PGRST116") {
      console.warn("Settings row not found in DB. Seeding from settings.json...");
      const local = loadLocalSettings();
      await upsertToDatabase(local);
      return NextResponse.json(local);
    }

    console.error("Supabase settings GET error:", error?.message || error);
  } catch (e: any) {
    console.error("GET /api/settings error:", e.message || e);
  }

  return NextResponse.json(loadLocalSettings());
}

// ──────────────────────────────────────────────
// POST /api/settings
// Saves settings to BOTH Supabase (primary) and local file (cache).
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.company || !body?.vehicles) {
      return NextResponse.json({ error: "Invalid settings structure provided." }, { status: 400 });
    }

    // 1. Save to Supabase (primary)
    const dbOk = await upsertToDatabase({ company: body.company, vehicles: body.vehicles });

    // 2. Write to local file (cache / fallback)
    writeLocalSettings(body);

    if (!dbOk) {
      return NextResponse.json(
        { error: "Saved locally but failed to sync to database. Please try again." },
        { status: 207 }
      );
    }

    return NextResponse.json({ success: true, settings: body });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings." },
      { status: 500 }
    );
  }
}
