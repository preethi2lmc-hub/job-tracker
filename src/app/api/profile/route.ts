import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { location: 1 } }
    );

  return NextResponse.json({ location: user?.location ?? "" });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const location = typeof body?.location === "string" ? body.location.trim() : "";

  const db = await getDb();
  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(session.user.id) }, { $set: { location } });

  return NextResponse.json({ ok: true, location });
}
