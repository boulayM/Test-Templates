import mongoose from "mongoose";

let isConnected = false;

export async function connectMongo(
  uri = process.env.NODE_ENV === "test" ? process.env.MONGODB_URI_TEST : process.env.MONGODB_URI
) {
  if (!uri) return false;
  if (isConnected) return true;

  try {
    await mongoose.connect(uri, { autoIndex: true });
    isConnected = true;
    return true;
  } catch (err) {
    console.error("[Mongo] connection failed", err);
    return false;
  }
}

export async function disconnectMongo() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

export function getMongoStatus() {
  return mongoose.connection.readyState;
}
