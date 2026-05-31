import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

interface RawBookingData {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  passengersCount: number;
  tripInstructions: string;
  tripType: "One Way" | "Round Trip";
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  numberOfDays: number;
  carType: string;
  distanceKm: number;
  totalFare: number;
}

// Helper to write booking securely to local JSON file
async function saveBookingToDatabase(bookingData: RawBookingData) {
  const dataDir = path.join(process.cwd(), "src", "data");
  const filePath = path.join(dataDir, "bookings.json");

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let bookings = [];

  // Read existing bookings if file exists
  if (fs.existsSync(filePath)) {
    try {
      const fileData = fs.readFileSync(filePath, "utf-8");
      bookings = JSON.parse(fileData);
    } catch (e) {
      console.error("Error reading bookings database, resetting database:", e);
      bookings = [];
    }
  }

  // Create unique ID and timestamp
  const newBooking = {
    id: `MYN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    ...bookingData,
  };

  bookings.push(newBooking);

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(bookings, null, 2), "utf-8");

  return newBooking;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    if (!emailAddress) missingFields.push("Email");
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
                <table style="width: 100%; border-collapse: collapse;">
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
                ${tripType === "Round Trip" ? `
                <tr>
                  <td class="meta-cell meta-label">Duration</td>
                  <td class="meta-cell meta-val">${numberOfDays} Days</td>
                </tr>
                ` : ""}
                <tr>
                  <td class="meta-cell meta-label">Vehicle Type</td>
                  <td class="meta-cell meta-val" style="color: #785900;">${carType}</td>
                </tr>
                <tr>
                  <td class="meta-cell meta-label">Est. Distance</td>
                  <td class="meta-cell meta-val">${distanceKm} km</td>
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
                  <span class="passenger-value"><a href="mailto:${emailAddress}">${emailAddress}</a></span>
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
                <div class="fare-amount">₹${totalFare}/-</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer-section">
              <p class="footer-text" style="font-weight: bold; color: #ffffff; letter-spacing: 0.05rem;">MAAYAN TRANS & SERVICES</p>
              <p class="footer-text">Professional Travel Solutions | Coimbatore, Tamil Nadu</p>
              <p class="footer-links">
                Phone: <a href="tel:+919894221664">+91 98942 21664</a> &nbsp;|&nbsp; 
                Email: <a href="mailto:info.maayandrivecar@gmail.com">info.maayandrivecar@gmail.com</a>
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
        to: "info.maayandrivecar@gmail.com",
        replyTo: emailAddress,
        subject: `[Booking Request] ${tripType} - From ${pickupLocation.split(",")[0]} to ${dropoffLocation.split(",")[0]} (${savedRecord.id})`,
        text: `New Booking received.\nID: ${savedRecord.id}\nPassenger: ${fullName}\nPhone: ${phoneNumber}\nFare: Rs ${totalFare}`,
        html: emailHtml,
      });

      console.log(`Booking email successfully sent for ${savedRecord.id}`);
    } else {
      console.warn("==========================================================================");
      console.warn("WARNING: SMTP server credentials are not configured in environment variables.");
      console.warn("The booking request email has been logged to console instead of sent:");
      console.warn(`Booking ID: ${savedRecord.id}`);
      console.warn(`Recipient: info.maayandrivecar@gmail.com`);
      console.warn(`Subject: [Booking Request] ${tripType} - From ${pickupLocation.split(",")[0]} to ${dropoffLocation.split(",")[0]}`);
      console.warn(`Passenger: ${fullName} (${emailAddress}) | Phone: ${phoneNumber}`);
      console.warn(`Trip details: ${pickupLocation} -> ${dropoffLocation} on ${pickupDate} @ ${pickupTime}`);
      console.warn(`Vehicle: ${carType} | Fare: ₹${totalFare}`);
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
