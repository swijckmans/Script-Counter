import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // Try to create a test website
    const website = await prisma.website.create({
      data: {
        url: "test.com",
      },
    });

    // Delete the test website
    await prisma.website.delete({
      where: { id: website.id },
    });

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Database connection failed",
      },
      { status: 500 }
    );
  }
}
