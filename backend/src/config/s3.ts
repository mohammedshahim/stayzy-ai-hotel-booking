import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

let client: S3Client | null = null;

// Constructed lazily (not at import time) because S3Client's constructor validates
// the region synchronously and throws if it's missing — that would crash the whole
// server on startup in any environment where S3 isn't configured yet, even though
// only image upload/delete actually need it.
export function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.S3_REGION,
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
          : undefined,
    });
  }
  return client;
}
