import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    // Prisma will cascade delete chapters and favorites if schema is configured
    await prisma.manga.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
