import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";

function serialize(doc: Record<string, unknown>) {
  const { _id, userId, ...rest } = doc;
  return { id: String(_id), user_id: String(userId), ...rest };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const docs = await db
    .collection("applications")
    .find({ userId: session.user.id })
    .sort({ created_at: -1 })
    .toArray();

  return NextResponse.json(docs.map(serialize));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.job_title !== "string" || typeof body.company !== "string") {
    return NextResponse.json(
      { error: "job_title and company are required." },
      { status: 400 }
    );
  }

  const status: ApplicationStatus = APPLICATION_STATUSES.includes(body.status)
    ? body.status
    : "Wishlist";

  const now = new Date();
  const doc = {
    userId: session.user.id,
    job_title: body.job_title,
    company: body.company,
    location: body.location || null,
    experience_level: body.experience_level || null,
    status,
    date_applied: body.date_applied || null,
    job_url: body.job_url || null,
    salary_range: body.salary_range || null,
    notes: body.notes || null,
    created_at: now,
    updated_at: now,
  };

  const db = await getDb();
  const result = await db.collection("applications").insertOne(doc);

  return NextResponse.json(serialize({ _id: result.insertedId, ...doc }), { status: 201 });
}
