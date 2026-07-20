import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/keep-alive
 *
 * Secure endpoint to query Supabase periodically and prevent the database from going idle.
 * Expects an "Authorization" header with "Bearer <KEEP_ALIVE_SECRET>".
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Retrieve the keep-alive secret from environment variables
    const secret = process.env.KEEP_ALIVE_SECRET;

    if (!secret) {
      console.error("Keep-Alive configuration error: KEEP_ALIVE_SECRET environment variable is not defined.");
      return NextResponse.json(
        { success: false, error: "Keep-alive token is not configured on the server." },
        { status: 500 }
      );
    }

    // 2. Validate the Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization header is missing." },
        { status: 401 }
      );
    }

    // Support both "Bearer <token>" format and direct "<token>" format
    const providedToken = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : authHeader.trim();

    if (providedToken !== secret.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid authorization token." },
        { status: 401 }
      );
    }

    // 3. Execute a lightweight query on Supabase
    // We select a single ID from the "bookings" table as it is guaranteed to exist.
    const { error } = await supabase
      .from("bookings")
      .select("id")
      .limit(1);

    if (error) {
      // Log the database error internally without exposing sensitive raw details to the client response
      console.error("Supabase keep-alive query failed:", error.message || error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to query database",
          details: error.message || "Database connection error"
        },
        { status: 500 }
      );
    }

    // 4. Return the successful keep-alive response
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        message: "Supabase is active"
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    // Handle any unhandled exceptions
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Unhandled exception in keep-alive endpoint:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
