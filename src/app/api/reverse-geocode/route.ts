import { NextRequest, NextResponse } from "next/server";
import { extractDistrict } from "@/lib/district";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat or lng parameter" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  try {
    if (apiKey) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const topResult = data.results[0];

        let mainName = topResult.address_components?.[0]?.long_name || topResult.formatted_address;
        if (topResult.address_components && topResult.address_components.length > 1) {
          const locality = topResult.address_components.find((c: any) =>
            c.types.includes("locality") || c.types.includes("sublocality") || c.types.includes("neighborhood")
          );
          if (locality) {
            mainName = locality.long_name;
          }
        }

        return NextResponse.json(
          {
            result: {
              name: mainName,
              formatted_address: topResult.formatted_address,
              district: extractDistrict(topResult.address_components),
              lat: parseFloat(lat),
              lng: parseFloat(lng),
            }
          },
          {
            headers: {
              "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600"
            }
          }
        );
      }
    }

    // Fallback: OpenStreetMap Nominatim reverse geocoding
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const osmRes = await fetch(osmUrl, {
      headers: { "User-Agent": "MaayanTrans/1.0" }
    });

    if (osmRes.ok) {
      const osmData = await osmRes.json();
      const mainText = osmData.address?.suburb || osmData.address?.city_district || osmData.address?.city || osmData.address?.town || osmData.name || "Current Location";

      return NextResponse.json({
        result: {
          name: mainText,
          formatted_address: osmData.display_name || `${lat}, ${lng}`,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        }
      });
    }

    return NextResponse.json({
      result: {
        name: "Current Location",
        formatted_address: `Latitude: ${lat}, Longitude: ${lng}`,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      }
    });
  } catch (error: unknown) {
    console.error("Reverse geocode error:", error);
    return NextResponse.json({
      result: {
        name: "Current Location",
        formatted_address: `Latitude: ${lat}, Longitude: ${lng}`,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      }
    });
  }
}
