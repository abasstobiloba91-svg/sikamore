import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. RUTHLESSLY CLEAN THE VERCEL KEYS
    // This removes any hidden spaces, tabs, or enter-key line-breaks (\n) that cause pattern errors
    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").replace(/[^a-zA-Z0-9]/g, "");
    const accessKey = (process.env.CLOUDFLARE_ACCESS_KEY_ID || "").replace(/[^a-zA-Z0-9]/g, "");
    const secretKey = (process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "").replace(/[^a-zA-Z0-9]/g, "");
    
    if (!accountId || !accessKey || !secretKey) {
      throw new Error("Missing or invalid Cloudflare credentials in Vercel.");
    }

    // 2. INITIALIZE CLIENT (Using us-east-1 to satisfy AWS SDK's strict region checker)
    const s3Client = new S3Client({
      region: "us-east-1",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 3. BULLETPROOF FILENAME GENERATION
    // Completely ignores the user's original file name to prevent special character crashes
    const fileExt = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${Date.now()}-${randomString}.${fileExt || 'jpg'}`;

    // 4. SEND TO CLOUDFLARE
    await s3Client.send(
      new PutObjectCommand({
        Bucket: "ssikamore-assets", // Ensure this exactly matches your R2 bucket name (all lowercase)
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      })
    );

    // 5. GENERATE PUBLIC URL
    const cleanPublicUrl = (process.env.CLOUDFLARE_PUBLIC_URL || "").trim().replace(/\/$/, "");
    const publicUrl = `${cleanPublicUrl}/${fileName}`;

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload to R2" }, { status: 500 });
  }
}
