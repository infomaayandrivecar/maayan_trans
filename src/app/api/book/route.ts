import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabaseClient";

interface RawBookingData {
  fullName: string;
  phoneNumber: string;
  emailAddress?: string;
  passengersCount: number;
  tripInstructions: string;
  tripType: "One Way" | "Round Trip" | "Outstation Trip";
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  numberOfDays: number;
  carType: string;
  distanceKm: number;
  totalFare: number;
}

// Helper to get 3-letter city code from location string
function getCityCode(location: string): string {
  const locLower = location.toLowerCase();
  // Tamil Nadu
  if (locLower.includes("chennai")) return "CHE";
  if (locLower.includes("coimbatore")) return "CBE";
  if (locLower.includes("madurai")) return "MDU";
  if (locLower.includes("tiruchirappalli") || locLower.includes("trichy")) return "TRZ";
  if (locLower.includes("salem")) return "SLM";
  if (locLower.includes("erode")) return "ERD";
  if (locLower.includes("tirunelveli")) return "TNV";
  if (locLower.includes("tenkasi")) return "TSI";
  if (locLower.includes("thoothukudi") || locLower.includes("tuticorin")) return "TCR";
  if (locLower.includes("kanyakumari") || locLower.includes("nagercoil")) return "KKM";
  if (locLower.includes("vellore")) return "VLR";
  if (locLower.includes("ranipet")) return "RPT";
  if (locLower.includes("tirupattur")) return "TPR";
  if (locLower.includes("tiruvannamalai")) return "TVM";
  if (locLower.includes("viluppuram")) return "VPM";
  if (locLower.includes("kallakurichi")) return "KLR";
  if (locLower.includes("cuddalore")) return "CDL";
  if (locLower.includes("mayiladuthurai")) return "MYD";
  if (locLower.includes("nagapattinam")) return "NGP";
  if (locLower.includes("thanjavur")) return "TNJ";
  if (locLower.includes("kumbakonam")) return "KUM";
  if (locLower.includes("tiruvarur")) return "TVR";
  if (locLower.includes("perambalur")) return "PBL";
  if (locLower.includes("ariyalur")) return "ARL";
  if (locLower.includes("namakkal")) return "NMK";
  if (locLower.includes("karur")) return "KRR";
  if (locLower.includes("dindigul")) return "DIG";
  if (locLower.includes("theni")) return "THN";
  if (locLower.includes("sivaganga")) return "SVG";
  if (locLower.includes("karaikudi")) return "KKD";
  if (locLower.includes("ramanathapuram")) return "RMD";
  if (locLower.includes("virudhunagar")) return "VNR";
  if (locLower.includes("srivilliputhur")) return "SVP";
  if (locLower.includes("krishnagiri")) return "KGI";
  if (locLower.includes("hosur")) return "HSR";
  if (locLower.includes("dharmapuri")) return "DPI";
  if (locLower.includes("nilgiris") || locLower.includes("ooty") || locLower.includes("udhagamandalam")) return "OTY";
  if (locLower.includes("tiruvallur")) return "TVL";
  if (locLower.includes("chengalpattu")) return "CGP";
  if (locLower.includes("mahabalipuram")) return "MBM";
  if (locLower.includes("pudukkottai")) return "PDK";

  // Kerala
  if (locLower.includes("thiruvananthapuram") || locLower.includes("trivandrum")) return "TRV";
  if (locLower.includes("kovalam")) return "KVL";
  if (locLower.includes("kollam")) return "KLM";
  if (locLower.includes("pathanamthitta")) return "PTA";
  if (locLower.includes("alappuzha") || locLower.includes("alleppey")) return "ALP";
  if (locLower.includes("kottayam")) return "KTM";
  if (locLower.includes("kumarakom")) return "KMR";
  if (locLower.includes("idukki")) return "IDK";
  if (locLower.includes("munnar")) return "MNR";
  if (locLower.includes("thekkady")) return "TKD";
  if (locLower.includes("ernakulam")) return "EKM";
  if (locLower.includes("kochi") || locLower.includes("cochin")) return "COK";
  if (locLower.includes("thrissur")) return "TSR";
  if (locLower.includes("guruvayur")) return "GVR";
  if (locLower.includes("palakkad")) return "PKD";
  if (locLower.includes("malappuram")) return "MLP";
  if (locLower.includes("kozhikode") || locLower.includes("calicut")) return "CCJ";
  if (locLower.includes("wayanad")) return "WYD";
  if (locLower.includes("sulthan bathery")) return "SBY";
  if (locLower.includes("kannur")) return "CNN";
  if (locLower.includes("thalassery")) return "TLS";
  if (locLower.includes("kasaragod")) return "KSD";
  if (locLower.includes("bekal")) return "BKL";
  if (locLower.includes("bengaluru") || locLower.includes("bangalore")) return "BLR";
  if (locLower.includes("mysuru") || locLower.includes("mysore")) return "MYS";
  if (locLower.includes("mangaluru") || locLower.includes("mangalore")) return "IXE";
  if (locLower.includes("hubballi") || locLower.includes("hubli")) return "HBL";
  if (locLower.includes("belagavi") || locLower.includes("belgaum")) return "IXG";

  if (locLower.includes("hyderabad")) return "HYD";
  if (locLower.includes("warangal")) return "WGL";
  if (locLower.includes("karimnagar")) return "KNR";
  if (locLower.includes("nizamabad")) return "NZB";

  if (locLower.includes("visakhapatnam") || locLower.includes("vizag")) return "VTZ";
  if (locLower.includes("vijayawada")) return "VGA";
  if (locLower.includes("tirupati")) return "TIR";
  if (locLower.includes("guntur")) return "GNT";
  if (locLower.includes("kakinada")) return "KKD";
  if (locLower.includes("nellore")) return "NLR";

  if (locLower.includes("mumbai") || locLower.includes("bombay")) return "BOM";
  if (locLower.includes("pune")) return "PNQ";
  if (locLower.includes("nagpur")) return "NAG";
  if (locLower.includes("nashik")) return "ISK";
  if (locLower.includes("aurangabad")) return "IXU";
  if (locLower.includes("kolhapur")) return "KLH";

  if (locLower.includes("delhi") || locLower.includes("new delhi")) return "DEL";
  if (locLower.includes("gurugram") || locLower.includes("gurgaon")) return "GGN";
  if (locLower.includes("faridabad")) return "FBD";
  if (locLower.includes("noida")) return "NDA";
  if (locLower.includes("ghaziabad")) return "GZB";

  if (locLower.includes("jaipur")) return "JAI";
  if (locLower.includes("jodhpur")) return "JDH";
  if (locLower.includes("udaipur")) return "UDR";
  if (locLower.includes("kota")) return "KOT";
  if (locLower.includes("ajmer")) return "AJM";

  if (locLower.includes("ahmedabad")) return "AMD";
  if (locLower.includes("surat")) return "STV";
  if (locLower.includes("vadodara") || locLower.includes("baroda")) return "BDQ";
  if (locLower.includes("rajkot")) return "RAJ";
  if (locLower.includes("gandhinagar")) return "GNR";

  if (locLower.includes("kolkata") || locLower.includes("calcutta")) return "CCU";
  if (locLower.includes("howrah")) return "HWH";
  if (locLower.includes("durgapur")) return "DGP";
  if (locLower.includes("siliguri")) return "IXB";

  if (locLower.includes("bhubaneswar")) return "BBI";
  if (locLower.includes("cuttack")) return "CTC";
  if (locLower.includes("rourkela")) return "RRK";
  if (locLower.includes("puri")) return "PURI";

  if (locLower.includes("lucknow")) return "LKO";
  if (locLower.includes("kanpur")) return "KNU";
  if (locLower.includes("agra")) return "AGR";
  if (locLower.includes("varanasi")) return "VNS";
  if (locLower.includes("prayagraj") || locLower.includes("allahabad")) return "IXD";
  if (locLower.includes("meerut")) return "MRT";

  if (locLower.includes("patna")) return "PAT";
  if (locLower.includes("gaya")) return "GAY";
  if (locLower.includes("muzaffarpur")) return "MZR";

  if (locLower.includes("ranchi")) return "IXR";
  if (locLower.includes("jamshedpur")) return "JSR";
  if (locLower.includes("dhanbad")) return "DHB";

  if (locLower.includes("chandigarh")) return "IXC";
  if (locLower.includes("amritsar")) return "ATQ";
  if (locLower.includes("ludhiana")) return "LUH";
  if (locLower.includes("jalandhar")) return "JUC";

  if (locLower.includes("dehradun")) return "DED";
  if (locLower.includes("haridwar")) return "HWD";
  if (locLower.includes("rishikesh")) return "RSH";

  if (locLower.includes("shimla")) return "SLV";
  if (locLower.includes("manali")) return "MNL";
  if (locLower.includes("dharamshala")) return "DHM";

  if (locLower.includes("srinagar")) return "SXR";
  if (locLower.includes("jammu")) return "IXJ";

  if (locLower.includes("guwahati")) return "GAU";
  if (locLower.includes("shillong")) return "SHL";
  if (locLower.includes("agartala")) return "IXA";
  if (locLower.includes("imphal")) return "IMF";
  if (locLower.includes("aizawl")) return "AJL";
  if (locLower.includes("itanagar")) return "ITA";
  if (locLower.includes("gangtok")) return "PYG";
  if (locLower.includes("kohima")) return "DMU";

  if (locLower.includes("goa") || locLower.includes("panaji") || locLower.includes("panjim")) return "GOI";

  if (locLower.includes("pondicherry") || locLower.includes("puducherry")) return "PNY";


  // Fallback candidate extraction: take first/last non-state segment and grab 3 letters
  const parts = location.split(",").map(p => p.trim());
  const stateKeywords = ["india", "tamil nadu", "karnataka", "kerala", "andhra pradesh", "telangana", "maharashtra"];
  const filtered = parts.filter(p => !stateKeywords.includes(p.toLowerCase()));
  const cityCandidate = filtered[filtered.length - 1] || parts[0] || "GEN";

  const cleanCandidate = cityCandidate.replace(/[^a-zA-Z]/g, "");
  if (cleanCandidate.length >= 3) {
    return cleanCandidate.substring(0, 3).toUpperCase();
  }
  return cleanCandidate.padEnd(3, "X").toUpperCase();
}

// Helper to format date in DDMMYY and time in HHMM in Asia/Kolkata timezone
function getBookingDateTimeStrings(): { formattedDate: string; formattedTime: string } {
  const now = new Date();

  // Format parts in Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  let day = "";
  let month = "";
  let year = "";
  let hour = "";
  let minute = "";

  for (const part of parts) {
    if (part.type === "day") day = part.value;
    else if (part.type === "month") month = part.value;
    else if (part.type === "year") year = part.value;
    else if (part.type === "hour") hour = part.value;
    else if (part.type === "minute") minute = part.value;
  }

  const formattedDate = `${day}${month}${year}`; // DDMMYY
  const formattedTime = `${hour}${minute}`; // HHMM

  return { formattedDate, formattedTime };
}

// Module-level sequence tracker to guarantee strictly increasing sequences within process runtime
let globalMaxSequence = 0;

// Helper to write booking securely to local JSON file
async function saveBookingToDatabase(bookingData: RawBookingData) {
  const localDataDir = path.join(process.cwd(), "src", "data");
  const localFilePath = path.join(localDataDir, "bookings.json");
  const tmpFilePath = path.join("/tmp", "bookings.json");

  let bookings: any[] = [];

  // Load existing bookings from both local data file and /tmp data file to determine max sequence number
  try {
    if (fs.existsSync(localFilePath)) {
      const fileData = fs.readFileSync(localFilePath, "utf-8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        bookings.push(...parsed);
      }
    }
  } catch (e) {
    console.warn("Failed to load existing local bookings for sequence calculation:", e);
  }

  try {
    if (fs.existsSync(tmpFilePath)) {
      const fileData = fs.readFileSync(tmpFilePath, "utf-8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        const existingIds = new Set(bookings.map((b) => b?.id).filter(Boolean));
        for (const tb of parsed) {
          if (tb && tb.id && !existingIds.has(tb.id)) {
            bookings.push(tb);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load existing tmp bookings for sequence calculation:", e);
  }

  // Calculate the highest sequence number from existing IDs in the format: MYN-[CITY]-[DDMMYY]-[HHMM]-[SEQ]
  const newFormatRegex = /^MYN-.*-[0-9]{4}$/;
  let maxSequence = globalMaxSequence;

  for (const b of bookings) {
    if (b && typeof b.id === "string" && newFormatRegex.test(b.id)) {
      const parts = b.id.split("-");
      const seqPart = parts[parts.length - 1];
      const seqNum = parseInt(seqPart, 10);
      if (!isNaN(seqNum) && seqNum > maxSequence) {
        maxSequence = seqNum;
      }
    }
  }

  // Also verify with Supabase rows to prevent duplicate sequences if local DB was reset
  try {
    // Try using the secure RPC function first
    const { data: dbNextSeq, error: rpcError } = await supabase.rpc("get_next_booking_sequence");

    if (!rpcError && dbNextSeq) {
      const dbSeqNum = parseInt(dbNextSeq, 10) - 1;
      if (!isNaN(dbSeqNum) && dbSeqNum > maxSequence) {
        maxSequence = dbSeqNum;
      }
    } else {
      // Graceful fallback to select query (if RLS is open or RPC function doesn't exist yet)
      const { data: recentBookings, error: selectError } = await supabase
        .from("bookings")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!selectError && recentBookings) {
        for (const rb of recentBookings) {
          if (rb && typeof rb.id === "string" && newFormatRegex.test(rb.id)) {
            const parts = rb.id.split("-");
            const seqPart = parts[parts.length - 1];
            const seqNum = parseInt(seqPart, 10);
            if (!isNaN(seqNum) && seqNum > maxSequence) {
              maxSequence = seqNum;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Failed to fetch recent bookings sequence from Supabase:", err);
  }

  const nextSequence = maxSequence + 1;
  globalMaxSequence = Math.max(globalMaxSequence, nextSequence);
  const nextSequenceStr = String(nextSequence).padStart(4, "0");
  const cityCode = getCityCode(bookingData.pickupLocation);
  const { formattedDate, formattedTime } = getBookingDateTimeStrings();

  // Create unique ID and timestamp in the requested format: MYN-CBE-040626-0303-0001
  const bookingId = `MYN-${cityCode}-${formattedDate}-${formattedTime}-${nextSequenceStr}`;

  const newBooking = {
    id: bookingId,
    createdAt: new Date().toISOString(),
    ...bookingData,
  };

  let success = false;

  // 1. Try writing to local data directory
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }

    // Refresh array to ensure we don't overwrite concurrent updates if file changed
    let freshBookings = [];
    if (fs.existsSync(localFilePath)) {
      const fileData = fs.readFileSync(localFilePath, "utf-8");
      freshBookings = JSON.parse(fileData);
    }
    freshBookings.push(newBooking);
    fs.writeFileSync(localFilePath, JSON.stringify(freshBookings, null, 2), "utf-8");
    success = true;
  } catch (localError: any) {
    console.warn(`Failed to write to local directory: ${localError.message || localError}. Retrying with /tmp...`);
  }

  // 2. If local write failed, try writing to /tmp/bookings.json
  if (!success) {
    try {
      let freshBookings = [];
      if (fs.existsSync(tmpFilePath)) {
        const fileData = fs.readFileSync(tmpFilePath, "utf-8");
        freshBookings = JSON.parse(fileData);
      }
      freshBookings.push(newBooking);
      fs.writeFileSync(tmpFilePath, JSON.stringify(freshBookings, null, 2), "utf-8");
      success = true;
    } catch (tmpError: any) {
      console.error(`Failed to write to /tmp file database: ${tmpError.message || tmpError}. Booking details will not be saved locally.`);
    }
  }

  // 3. Try writing to Supabase
  try {
    const { error: supabaseError } = await supabase
      .from("bookings")
      .insert({
        id: newBooking.id,
        full_name: bookingData.fullName,
        phone_number: bookingData.phoneNumber,
        email_address: bookingData.emailAddress,
        passengers_count: bookingData.passengersCount,
        trip_instructions: bookingData.tripInstructions,
        trip_type: bookingData.tripType,
        pickup_location: bookingData.pickupLocation,
        dropoff_location: bookingData.dropoffLocation,
        pickup_date: bookingData.pickupDate,
        pickup_time: bookingData.pickupTime,
        number_of_days: bookingData.numberOfDays,
        car_type: bookingData.carType,
        distance_km: bookingData.distanceKm,
        total_fare: bookingData.totalFare,
      });

    if (supabaseError) {
      console.error("Failed to save booking to Supabase:", supabaseError.message || supabaseError);
    } else {
      console.log(`Booking successfully saved to Supabase for ${newBooking.id}`);
    }
  } catch (err: any) {
    console.error("Error connecting to Supabase:", err.message || err);
  }

  return newBooking;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Load custom settings dynamically
    let companySettings = {
      phone: "+91 98942 21664",
      email: "maayantransporters@gmail.com",
      address: "11-E, RKK Nagar, Singanallur, Coimbatore, Tamil Nadu, India",
      notificationEmails: ["info.maayandrivecar@gmail.com"]
    };

    try {
      // 1. Try fetching from Supabase settings table
      const { data: dbSettings, error: dbError } = await supabase
        .from("settings")
        .select("company")
        .eq("id", "current")
        .single();

      if (!dbError && dbSettings && dbSettings.company) {
        const settingsPath = path.join(process.cwd(), "src", "data", "settings.json");
        let localCompany = {
          phone: "+91 98942 21664",
          email: "maayantransporters@gmail.com",
          address: "11-E, RKK Nagar, Singanallur, Coimbatore, Tamil Nadu, India",
          notificationEmails: ["info.maayandrivecar@gmail.com"],
          minKmOneWay: 5,
          minKmRoundTrip: 5,
          minKmOutstation: 100
        };
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
            if (settingsData && settingsData.company) {
              localCompany = { ...localCompany, ...settingsData.company };
            }
          } catch (_) {}
        }
        companySettings = {
          ...localCompany,
          ...(dbSettings.company as any)
        };
      } else {
        if (dbError) {
          console.warn("Supabase fetch error for settings, falling back to local file:", dbError.message || dbError);
        }
        // 2. Fallback to local settings.json file
        const settingsPath = path.join(process.cwd(), "src", "data", "settings.json");
        if (fs.existsSync(settingsPath)) {
          const settingsData = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
          if (settingsData && settingsData.company) {
            companySettings = settingsData.company;
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load settings in booking route, using default values:", err);
    }
    const {
      fullName,
      phoneNumber,
      emailAddress,
      passengersCount,
      tripInstructions,
      tripType, // "One Way" | "Round Trip"
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      numberOfDays,
      carType,
      distanceKm,
      totalFare,
    } = body;

    const missingFields = [];
    if (!fullName) missingFields.push("Full Name");
    if (!phoneNumber) missingFields.push("Phone Number");
    if (!pickupLocation) missingFields.push("Pickup Location");
    if (!dropoffLocation) missingFields.push("Drop-off Location");
    if (!pickupDate) missingFields.push("Pickup Date");
    if (!pickupTime) missingFields.push("Pickup Time");
    if (!carType) missingFields.push("Car Type");
    if (!totalFare) missingFields.push("Total Fare");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required details: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const minKmOneWay = (companySettings as any).minKmOneWay !== undefined ? Number((companySettings as any).minKmOneWay) : 5;
    const minKmRoundTrip = (companySettings as any).minKmRoundTrip !== undefined ? Number((companySettings as any).minKmRoundTrip) : 5;
    const minKmOutstation = (companySettings as any).minKmOutstation !== undefined ? Number((companySettings as any).minKmOutstation) : 100;

    const parsedDistance = parseFloat(distanceKm);

    if (tripType === "One Way" && parsedDistance < minKmOneWay) {
      return NextResponse.json(
        { error: `One-Way bookings require a minimum trip distance of ${minKmOneWay} km.` },
        { status: 400 }
      );
    }

    if (tripType === "Round Trip" && parsedDistance < minKmRoundTrip) {
      return NextResponse.json(
        { error: `Round Trip bookings require a minimum trip distance of ${minKmRoundTrip} km.` },
        { status: 400 }
      );
    }

    if (tripType === "Outstation Trip" && parsedDistance < minKmOutstation) {
      return NextResponse.json(
        { error: `Outstation bookings require a minimum trip distance of ${minKmOutstation} km.` },
        { status: 400 }
      );
    }

    if (parseInt(passengersCount) <= 0 || isNaN(parseInt(passengersCount))) {
      return NextResponse.json(
        { error: "Number of passengers must be at least 1." },
        { status: 400 }
      );
    }

    // Save to local database file
    const savedRecord = await saveBookingToDatabase({
      fullName,
      phoneNumber,
      emailAddress,
      passengersCount: parseInt(passengersCount),
      tripInstructions: tripInstructions || "",
      tripType,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      numberOfDays: numberOfDays ? parseInt(numberOfDays) : 1,
      carType,
      distanceKm: parseFloat(distanceKm),
      totalFare: parseFloat(totalFare),
    });

    // Format Email HTML Content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Request - Maayan Trans</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@700;800&display=swap');
          
          body {
            font-family: 'Inter', Arial, sans-serif;
            background-color: #fcf9f8;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .email-wrapper {
            background-color: #fcf9f8;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 12px 40px rgba(79, 70, 50, 0.06);
            border: 1px solid rgba(0, 0, 0, 0.04);
            overflow: hidden;
          }
          .header-banner {
            background: linear-gradient(135deg, #785900 0%, #a17802 100%);
            padding: 35px 30px;
            text-align: center;
          }
          .brand-title {
            font-family: 'Manrope', 'Arial Black', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            margin: 0;
            letter-spacing: 0.12rem;
            text-transform: uppercase;
          }
          .brand-subtitle {
            font-size: 11px;
            font-weight: 700;
            color: #ffc107;
            margin: 8px 0 0 0;
            letter-spacing: 0.08rem;
            text-transform: uppercase;
          }
          .content-stage {
            padding: 30px;
          }
          .section-title {
            font-family: 'Manrope', sans-serif;
            font-size: 15px;
            font-weight: 700;
            color: #785900;
            text-transform: uppercase;
            letter-spacing: 0.05rem;
            margin: 0 0 15px 0;
            border-bottom: 2px solid #ffc107;
            padding-bottom: 6px;
          }
          .route-display {
            background-color: #fcf9f8;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            border: 1px solid rgba(0, 0, 0, 0.03);
          }
          .route-node {
            display: inline-block;
            vertical-align: top;
          }
          .route-label {
            font-size: 10px;
            font-weight: 700;
            color: #8c8c8c;
            text-transform: uppercase;
            letter-spacing: 0.04rem;
            margin-bottom: 4px;
          }
          .route-value {
            font-size: 14px;
            font-weight: 600;
            color: #1b1c1c;
            line-height: 1.3;
          }
          .route-arrow {
            text-align: center;
            font-size: 22px;
            color: #ffc107;
            padding: 10px 0;
          }
          .meta-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .meta-cell {
            padding: 12px 15px;
            border-bottom: 1px solid #f0eded;
          }
          .meta-label {
            font-size: 12px;
            color: #52525b;
            font-weight: 500;
            width: 40%;
          }
          .meta-val {
            font-size: 13px;
            color: #1b1c1c;
            font-weight: 600;
            text-align: right;
          }
          .passenger-card {
            background-color: #ffffff;
            border: 1px solid #f0eded;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 25px;
          }
          .passenger-row {
            padding: 8px 0;
            border-bottom: 1px solid #fcf9f8;
          }
          .passenger-row:last-child {
            border-bottom: none;
          }
          .passenger-label {
            font-size: 12px;
            color: #52525b;
            font-weight: 500;
            display: inline-block;
            width: 35%;
          }
          .passenger-value {
            font-size: 13px;
            color: #1b1c1c;
            font-weight: 600;
            display: inline-block;
            width: 64%;
            vertical-align: top;
          }
          .passenger-value a {
            color: #785900;
            text-decoration: none;
          }
          .instructions-block {
            background-color: #fcf9f8;
            border-radius: 6px;
            padding: 12px 15px;
            font-size: 12px;
            color: #52525b;
            font-style: italic;
            border-left: 3px solid #ffc107;
            margin-top: 5px;
          }
          .fare-callout {
            background: linear-gradient(135deg, #785900 0%, #543f00 100%);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            color: #ffffff;
            margin-bottom: 20px;
          }
          .fare-title {
            font-size: 11px;
            font-weight: 700;
            color: #ffc107;
            text-transform: uppercase;
            letter-spacing: 0.08rem;
            margin: 0 0 5px 0;
          }
          .fare-amount {
            font-family: 'Manrope', sans-serif;
            font-size: 28px;
            font-weight: 800;
            margin: 0;
          }
          .footer-section {
            background-color: #111111;
            padding: 25px 30px;
            text-align: center;
            font-size: 11px;
            color: #a1a1aa;
            border-radius: 0 0 12px 12px;
          }
          .footer-text {
            margin: 0 0 8px 0;
            line-height: 1.4;
          }
          .footer-links {
            margin-top: 10px;
            font-weight: 600;
          }
          .footer-links a {
            color: #ffb300;
            text-decoration: none;
          }

          /* Mobile Responsiveness */
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              padding: 20px 10px !important;
            }
            .content-stage {
              padding: 20px 15px !important;
            }
            .route-table td {
              display: block !important;
              width: 100% !important;
              text-align: center !important;
            }
            .route-arrow {
              padding: 5px 0 !important;
              transform: rotate(90deg);
              display: inline-block;
            }
            .passenger-label {
              display: block !important;
              width: 100% !important;
              margin-bottom: 4px !important;
            }
            .passenger-value {
              display: block !important;
              width: 100% !important;
            }
            .meta-label {
              width: auto !important;
              padding-right: 10px !important;
            }
            .brand-title {
              font-size: 20px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <!-- Header Banner -->
            <div class="header-banner">
              <h1 class="brand-title">Maayan Trans</h1>
              <div class="brand-subtitle">New Booking Request Received</div>
            </div>
            
            <!-- Main Content -->
            <div class="content-stage">
              <!-- Route Display -->
              <h2 class="section-title">Route details</h2>
              <div class="route-display">
                <table class="route-table" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 45%; vertical-align: top;">
                      <div class="route-label">Pickup Location</div>
                      <div class="route-value">${pickupLocation}</div>
                    </td>
                    <td style="width: 10%; text-align: center; vertical-align: middle;">
                      <div class="route-arrow">➔</div>
                    </td>
                    <td style="width: 45%; vertical-align: top; text-align: right;">
                      <div class="route-label">Drop-off Location</div>
                      <div class="route-value">${dropoffLocation}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Journey Summary -->
              <h2 class="section-title">Journey Summary</h2>
              <table class="meta-grid">
                <tr>
                  <td class="meta-cell meta-label">Booking ID</td>
                  <td class="meta-cell meta-val" style="color: #785900;">${savedRecord.id}</td>
                </tr>
                <tr>
                  <td class="meta-cell meta-label">Trip Type</td>
                  <td class="meta-cell meta-val">${tripType}</td>
                </tr>
                <tr>
                  <td class="meta-cell meta-label">Date & Time</td>
                  <td class="meta-cell meta-val">${pickupDate} at ${pickupTime}</td>
                </tr>
                ${(tripType === "Round Trip" || tripType === "Outstation Trip") ? `
                <tr>
                  <td class="meta-cell meta-label">Duration</td>
                  <td class="meta-cell meta-val">${numberOfDays} ${numberOfDays === 1 ? 'Day' : 'Days'}</td>
                </tr>
                ` : ""}
                <tr>
                  <td class="meta-cell meta-label">Vehicle Type</td>
                  <td class="meta-cell meta-val" style="color: #785900;">${carType}</td>
                </tr>
                <tr>
                  <td class="meta-cell meta-label">Est. Distance</td>
                  <td class="meta-cell meta-val">${Number(distanceKm).toFixed(2)} km</td>
                </tr>
              </table>

              <!-- Passenger Details -->
              <h2 class="section-title">Passenger Details</h2>
              <div class="passenger-card">
                <div class="passenger-row">
                  <span class="passenger-label">Full Name:</span>
                  <span class="passenger-value">${fullName}</span>
                </div>
                <div class="passenger-row">
                  <span class="passenger-label">Phone:</span>
                  <span class="passenger-value"><a href="tel:${phoneNumber}">${phoneNumber}</a></span>
                </div>
                <div class="passenger-row">
                  <span class="passenger-label">Email:</span>
                  <span class="passenger-value">
                    ${emailAddress ? `<a href="mailto:${emailAddress}">${emailAddress}</a>` : `<span style="color: #8c8c8c;">Not provided</span>`}
                  </span>
                </div>
                <div class="passenger-row">
                  <span class="passenger-label">Passengers:</span>
                  <span class="passenger-value">${passengersCount}</span>
                </div>
                <div class="passenger-row" style="border-bottom: none;">
                  <span class="passenger-label">Instructions:</span>
                  <span class="passenger-value" style="font-weight: normal;">
                    ${tripInstructions ? `<div class="instructions-block">"${tripInstructions}"</div>` : `<span style="color: #8c8c8c;">None provided</span>`}
                  </span>
                </div>
              </div>

              <!-- Fare Callout -->
              <div class="fare-callout">
                <div class="fare-title">ESTIMATED TOTAL FARE</div>
                <div class="fare-amount">₹${Math.round(totalFare).toLocaleString("en-IN")}/-</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer-section">
              <p class="footer-text" style="font-weight: bold; color: #ffffff; letter-spacing: 0.05rem;">MAAYAN TRANS & SERVICES</p>
              <p class="footer-text">Professional Travel Solutions | Coimbatore, Tamil Nadu</p>
              <p class="footer-links">
                Phone: <a href="tel:${companySettings.phone.replace(/\s+/g, "")}">${companySettings.phone}</a> &nbsp;|&nbsp; 
                Email: <a href="mailto:${companySettings.email}">${companySettings.email}</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Attempt to send email
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Get list of notification emails
    let notificationEmails = ["info.maayandrivecar@gmail.com"];
    if (companySettings && (companySettings as any).notificationEmails && Array.isArray((companySettings as any).notificationEmails) && (companySettings as any).notificationEmails.length > 0) {
      notificationEmails = (companySettings as any).notificationEmails;
    }
    const toEmailsString = notificationEmails.join(", ");

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"${fullName} (via Maayan Trans)" <${smtpUser}>`,
        to: toEmailsString,
        replyTo: emailAddress || undefined,
        subject: `[Booking Request] ${tripType} - From ${pickupLocation.split(",")[0]} to ${dropoffLocation.split(",")[0]} (${savedRecord.id})`,
        text: `New Booking received.\nID: ${savedRecord.id}\nPassenger: ${fullName}\nPhone: ${phoneNumber}\nFare: Rs ${Math.round(totalFare)}`,
        html: emailHtml,
      });

      console.log(`Booking email successfully sent for ${savedRecord.id}`);
    } else {
      console.warn("==========================================================================");
      console.warn("WARNING: SMTP server credentials are not configured in environment variables.");
      console.warn("The booking request email has been logged to console instead of sent:");
      console.warn(`Booking ID: ${savedRecord.id}`);
      console.warn(`Recipient: ${toEmailsString}`);
      console.warn(`Subject: [Booking Request] ${tripType} - From ${pickupLocation.split(",")[0]} to ${dropoffLocation.split(",")[0]}`);
      console.warn(`Passenger: ${fullName} (${emailAddress}) | Phone: ${phoneNumber}`);
      console.warn(`Trip details: ${pickupLocation} -> ${dropoffLocation} on ${pickupDate} @ ${pickupTime}`);
      console.warn(`Vehicle: ${carType} | Fare: ₹${Math.round(totalFare)}`);
      console.warn("==========================================================================");
    }

    return NextResponse.json({ success: true, booking: savedRecord });
  } catch (error: unknown) {
    console.error("Booking handler error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process booking." },
      { status: 500 }
    );
  }
}
