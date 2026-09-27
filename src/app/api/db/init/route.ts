import { NextRequest, NextResponse } from "next/server";
import { connectDB, isMongoConnected, seedAllMongoCollections } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const isConnected = isMongoConnected();

    if (isConnected) {
      const counts = await seedAllMongoCollections();
      return NextResponse.json({
        status: "CONNECTED",
        message: "Successfully connected to MongoDB Atlas and initialized all collections!",
        collections: counts,
      });
    } else {
      return NextResponse.json({
        status: "MEMORY_MODE",
        message: "MongoDB connection not established or invalid URI. Running in-memory mode.",
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    if (!isMongoConnected()) {
      return NextResponse.json(
        { error: "MongoDB is not connected. Please check MONGODB_URI in .env.local" },
        { status: 400 }
      );
    }

    const counts = await seedAllMongoCollections(true); // force re-seed if empty or reset
    return NextResponse.json({
      success: true,
      message: "All MongoDB tables/collections initialized & seeded successfully!",
      collections: counts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
