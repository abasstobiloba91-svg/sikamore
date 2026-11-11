import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").replace(/[^a-zA-Z0-9]/g, "");
    const accessKey = (process.env.CLOUDFLARE_ACCESS_KEY_ID || "").replace(/\s+/g, "");
    const secretKey = (process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "").replace(/\s+/g, "");
    
    if (!accountId || !accessKey || !secretKey) {
      throw new Error("Missing credentials in Vercel.");
    }

    const s3Client = new S3Client({
      region: "auto", 
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, 
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileExt = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${Date.now()}-${randomString}.${fileExt || 'jpg'}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: "ssikamore-assets", // <-- HARDCODED: Vercel can no longer mess this up
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      })
    );

    const cleanPublicUrl = (process.env.CLOUDFLARE_PUBLIC_URL || "").replace(/\s+/g, "").replace(/\/$/, "");
    const publicUrl = `${cleanPublicUrl}/${fileName}`;

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error("Upload error details:", error);
    return NextResponse.json({ error: error.message || "Failed to upload to R2" }, { status: 500 });
  }
}
