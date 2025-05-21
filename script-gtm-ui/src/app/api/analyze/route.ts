import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface Tag {
  name: string;
  count: number;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Call the backend API
    const response = await fetch(
      `http://localhost:3000/count-scripts?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return NextResponse.json(
        { error: `Backend API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Backend API response:", data);

    // Store the results in the database
    const website = await prisma.website.upsert({
      where: { url },
      update: {
        lastAnalyzedAt: new Date(),
        screenshotPath: data.screenshotPath,
      },
      create: {
        url,
        screenshotPath: data.screenshotPath,
      },
    });

    // Delete existing tags for this website
    await prisma.tag.deleteMany({
      where: { websiteId: website.id },
    });

    // Create new tags if they exist
    if (data.tags && data.tags.length > 0) {
      await Promise.all(
        data.tags.map((tag: Tag) =>
          prisma.tag.create({
            data: {
              name: tag.name,
              count: tag.count,
              websiteId: website.id,
            },
          })
        )
      );
    }

    const analysis = await prisma.analysis.create({
      data: {
        websiteId: website.id,
        firstPartyCount: data.firstPartyScriptCount,
        thirdPartyCount: data.thirdPartyScriptCount,
        inlineCount: data.inlineScriptCount,
        rawResults: JSON.stringify(data),
      },
    });

    return NextResponse.json({ id: analysis.id });
  } catch (error) {
    console.error("Error analyzing URL:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze website",
      },
      { status: 500 }
    );
  }
}
