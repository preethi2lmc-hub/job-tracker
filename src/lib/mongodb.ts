import { MongoClient, type Db } from "mongodb";

// Cache the client across hot reloads in dev, and across invocations on
// Vercel's serverless runtime, so we don't open a new connection per request.
const globalForMongo = global as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise(): Promise<MongoClient> {
  // Checked lazily (not at module load) so this file can be imported during
  // Next.js's build-time route analysis without MONGODB_URI being set yet.
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db("jobtracker");
}
