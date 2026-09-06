import { NextResponse } from "next/server";
import { seedCleanDatabaseToFirestore } from "@/lib/firebase/firestore";

export async function GET() {
  try {
    const result = await seedCleanDatabaseToFirestore();
    return NextResponse.json({
      message: "Seed database operation completed",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
