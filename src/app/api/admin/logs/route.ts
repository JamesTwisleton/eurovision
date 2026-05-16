import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLogSize, getLogStream } from "@/lib/logger";
import { Readable } from "stream";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download");

  if (download === "true") {
    const stream = getLogStream();
    if (!stream) {
      return NextResponse.json({ error: "Log file not found" }, { status: 404 });
    }

    // @ts-ignore - ReadableStream/Readable compatibility
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="admin.log"',
      },
    });
  }

  const size = getLogSize();
  return NextResponse.json({ size });
}
