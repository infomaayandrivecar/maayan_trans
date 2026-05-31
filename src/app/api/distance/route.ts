import { NextRequest, NextResponse } from "next/server";

// Haversine formula to compute crow-flies distance between two points in km
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");
  const destLat = searchParams.get("destLat");
  const destLng = searchParams.get("destLng");

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "Missing coordinate parameters" }, { status: 400 });
  }

  const oLat = parseFloat(originLat);
  const oLng = parseFloat(originLng);
  const dLat = parseFloat(destLat);
  const dLng = parseFloat(destLng);

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key is missing on the server" },
      { status: 500 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${oLat},${oLng}&destinations=${dLat},${dLng}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (
      data.status === "OK" &&
      data.rows &&
      data.rows[0] &&
      data.rows[0].elements &&
      data.rows[0].elements[0] &&
      data.rows[0].elements[0].status === "OK"
    ) {
      const element = data.rows[0].elements[0];
      const distanceText = element.distance.text;
      const distanceValueKm = element.distance.value / 1000; // API returns meters
      const durationText = element.duration.text;
      const durationValueSec = element.duration.value;

      return NextResponse.json({
        distance: distanceValueKm,
        distanceText,
        duration: durationValueSec,
        durationText,
        source: "google",
      });
    }

    // Fallback: Haversine distance with standard road correction factor (1.3x)
    // and estimated travel duration at an average speed of 60 km/h.
    const haversineDist = getHaversineDistance(oLat, oLng, dLat, dLng);
    const estimatedRoadDistKm = Math.round(haversineDist * 1.3 * 10) / 10;
    
    // speed is 60km/h => 1km per minute => estimatedRoadDistKm * 60 seconds
    const durationSec = Math.round(estimatedRoadDistKm * 60); 
    const hours = Math.floor(durationSec / 3600);
    const minutes = Math.floor((durationSec % 3600) / 60);
    const durationText = hours > 0 ? `${hours} hours ${minutes} mins` : `${minutes} mins`;

    return NextResponse.json({
      distance: estimatedRoadDistKm,
      distanceText: `${estimatedRoadDistKm} km`,
      duration: durationSec,
      durationText,
      source: "fallback",
    });
  } catch {
    // If the API call throws an error, return the fallback calculation
    const haversineDist = getHaversineDistance(oLat, oLng, dLat, dLng);
    const estimatedRoadDistKm = Math.round(haversineDist * 1.3 * 10) / 10;
    const durationSec = Math.round(estimatedRoadDistKm * 60); 
    const hours = Math.floor(durationSec / 3600);
    const minutes = Math.floor((durationSec % 3600) / 60);
    const durationText = hours > 0 ? `${hours} hours ${minutes} mins` : `${minutes} mins`;

    return NextResponse.json({
      distance: estimatedRoadDistKm,
      distanceText: `${estimatedRoadDistKm} km`,
      duration: durationSec,
      durationText,
      source: "fallback_on_error",
    });
  }
}
