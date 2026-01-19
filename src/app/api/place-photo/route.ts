import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge'; // Optional: Use edge if deployed to Vercel/Cloudflare

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name");

    if (!name) {
        return new NextResponse("Missing 'name' parameter", { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return new NextResponse("Server configuration error", { status: 500 });
    }

    // Proxy the request to Google Places API to get the image
    // Using redirect mode (default) so we don't pay for bandwidth twice
    // Google returns a 302 to the actual image blob
    const googleUrl = `https://places.googleapis.com/v1/${name}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=800`;

    return NextResponse.redirect(googleUrl);
}
