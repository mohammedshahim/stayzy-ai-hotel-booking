import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import { getS3Client } from "../config/s3";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface UploadableFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export function assertValidImage(file: UploadableFile): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be smaller than 5MB");
  }
}

function getBucket(): string {
  if (!env.S3_BUCKET) {
    throw new Error("Image upload is not configured: S3_BUCKET is missing");
  }
  return env.S3_BUCKET;
}

export async function uploadImage(file: UploadableFile, folder: string): Promise<string> {
  assertValidImage(file);
  const bucket = getBucket();
  const extension = file.originalname.split(".").pop();
  const key = `${folder}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `https://${bucket}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}

export async function deleteImageByUrl(url: string): Promise<void> {
  const bucket = getBucket();
  const key = url.split(".amazonaws.com/")[1];
  if (!key) return;
  await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
