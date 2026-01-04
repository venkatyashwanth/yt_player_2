import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
        return NextResponse.json(
            { error: "Missing id" },
            { status: 400 }
        );
    }
    const apiKey = process.env.YT_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${apiKey}`;
    try {
        const response = await fetch(url,{
            next: {revalidate: 3600}
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "YouTube API error" },
                { status: 500 }
            );
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const title = data.items[0].snippet.title;
            return NextResponse.json({ title });
        }

        return NextResponse.json(
            { error: "Invalid video id" },
            { status: 404 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}