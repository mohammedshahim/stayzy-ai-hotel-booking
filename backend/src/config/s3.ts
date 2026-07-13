import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

let client: S3Client | null = null;

// Constructed lazily — S3Client's constructor throws synchronously if the region is missing, which would crash startup in envs where S3 isn't configured.
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
