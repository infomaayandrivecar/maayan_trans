import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const getSettingsPath = () => {
  return path.join(process.cwd(), "src", "data", "settings.json");
};

// Default settings fallback
const defaultSettings = {
  company: {
    phone: "+91 98942 21664",
    email: "maayantransporters@gmail.com",
    address: "11-E, RKK Nagar, Singanallur, Coimbatore, Tamil Nadu, India",
    marqueeText: "✨ Welcome to Maayan Trans & Services! Premium Inter-City Travel, Airport Transfers, and Local Rides at Affordable Rates. ✨ | 📞 Call us at +91 98942 21664 to book your ride today! 📞 | ⭐ Safe, Vetted, and Professional Drivers for a Premium Experience. ⭐",
    notificationEmails: ["info.maayandrivecar@gmail.com"],
    gst: "29MAAYN1234F1Z5",
    pan: "MAAYN1234F"
  },
  vehicles: {
    hatchback: { ratePerKm: 13, driverAllowancePerDay: 300 },
    sedan: { ratePerKm: 14, driverAllowancePerDay: 350 },
    premium_sedan: { ratePerKm: 16, driverAllowancePerDay: 400 },
    suv: { ratePerKm: 17.5, driverAllowancePerDay: 450 },
    premium_suv: { ratePerKm: 20, driverAllowancePerDay: 500 }
  }
};

export async function GET() {
  try {
    const filePath = getSettingsPath();
    if (!fs.existsSync(filePath)) {
      // Ensure folder exists and write default config
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(defaultSettings, null, 2), "utf-8");
      return NextResponse.json(defaultSettings);
    }

    const fileData = fs.readFileSync(filePath, "utf-8");
    const settings = JSON.parse(fileData);
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET settings API error:", error);
    return NextResponse.json(defaultSettings); // fallback to defaults on error
  }
}

export async function POST(request: NextRequest) {
  try {
    const filePath = getSettingsPath();
    const body = await request.json();

    if (!body || !body.company || !body.vehicles) {
      return NextResponse.json(
        { error: "Invalid settings structure provided." },
        { status: 400 }
      );
    }

    // Write updated settings to file
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");

    return NextResponse.json({ success: true, settings: body });
  } catch (error: any) {
    console.error("POST settings API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings." },
      { status: 500 }
    );
  }
}
