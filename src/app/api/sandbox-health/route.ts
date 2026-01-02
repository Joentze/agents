import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { previewUrl } = await request.json();

    if (!previewUrl) {
      return NextResponse.json(
        { error: "Preview URL is required" },
        { status: 400 }
      );
    }

    // Try to fetch the sandbox URL from the server side (no CORS issues)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(previewUrl, {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      return NextResponse.json({
        alive: response.ok,
        status: response.status,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return NextResponse.json({
        alive: false,
        error:
          fetchError instanceof Error ? fetchError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Sandbox health check error:", error);
    return NextResponse.json(
      { error: "Failed to check sandbox health" },
      { status: 500 }
    );
  }
}




