import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";

function serialize(doc: Record<string, unknown>) {
  const { _id, userId, ...rest } = doc;
  return { id: String(_id), user_id: String(userId), ...rest };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const status: ApplicationStatus | undefined = APPLICATION_STATUSES.includes(
    body.status
  )
    ? body.status
    : undefined;

  const db = await getDb();
  const result = await db.collection("applications").findOneAndUpdate(
    { _id: new ObjectId(id), userId: session.user.id },
    {
      $set: {
        ...(body.job_title !== undefined && { job_title: body.job_title }),
        ...(body.company !== undefined && { company: body.company }),
        ...(body.location !== undefined && { location: body.location || null }),
        ...(body.experience_level !== undefined && {
          experience_level: body.experience_level || null,
        }),
        ...(status && { status }),
        ...(body.date_applied !== undefined && {
          date_applied: body.date_applied || null,
        }),
        ...(body.job_url !== undefined && { job_url: body.job_url || null }),
        ...(body.salary_range !== undefined && {
          salary_range: body.salary_range || null,
        }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serialize(result));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db
    .collection("applications")
    .deleteOne({ _id: new ObjectId(id), userId: session.user.id });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
