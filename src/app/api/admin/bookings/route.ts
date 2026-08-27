import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {
        // Query param fallback
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // 1. Delete associated trip_sheets from Supabase
    try {
      await supabase.from("trip_sheets").delete().eq("booking_id", id);
    } catch (err) {
      console.warn("Trip sheet delete warning in API:", err);
    }

    // 2. Delete booking from Supabase
    const { error: supabaseError } = await supabase.from("bookings").delete().eq("id", id);
    if (supabaseError) {
      console.error("Supabase booking delete error:", supabaseError);
    }

    // 3. Remove from local JSON file if present
    try {
      const localFilePath = path.join(process.cwd(), "src", "data", "bookings.json");
      if (fs.existsSync(localFilePath)) {
        const data = fs.readFileSync(localFilePath, "utf-8");
        const list = JSON.parse(data);
        if (Array.isArray(list)) {
          const updated = list.filter((b: any) => b?.id !== id);
          fs.writeFileSync(localFilePath, JSON.stringify(updated, null, 2), "utf-8");
        }
      }
    } catch (fileErr) {
      console.warn("Local bookings.json delete warning:", fileErr);
    }

    // 4. Remove from /tmp/bookings.json fallback if present
    try {
      const tmpFilePath = path.join("/tmp", "bookings.json");
      if (fs.existsSync(tmpFilePath)) {
        const data = fs.readFileSync(tmpFilePath, "utf-8");
        const list = JSON.parse(data);
        if (Array.isArray(list)) {
          const updated = list.filter((b: any) => b?.id !== id);
          fs.writeFileSync(tmpFilePath, JSON.stringify(updated, null, 2), "utf-8");
        }
      }
    } catch (tmpErr) {
      console.warn("/tmp/bookings.json delete warning:", tmpErr);
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: error.message || "Failed to delete booking" }, { status: 500 });
  }
}
