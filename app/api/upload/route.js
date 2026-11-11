import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    if (!process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error("Missing CLOUDFLARE_ACCOUNT_ID");
    if (!process.env.CLOUDFLARE_ACCESS_KEY_ID) throw new Error("Missing CLOUDFLARE_ACCESS_KEY_ID");
    if (!process.env.CLOUDFLARE_SECRET_ACCESS_KEY) throw new Error("Missing CLOUDFLARE_SECRET_ACCESS_KEY");
    if (!process.env.CLOUDFLARE_PUBLIC_URL) throw new Error("Missing CLOUDFLARE_PUBLIC_URL");

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY.trim(),
      },
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: "ssikamore-assets", 
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      })
    );

    const cleanPublicUrl = process.env.CLOUDFLARE_PUBLIC_URL.trim().replace(/\/$/, "");
    const publicUrl = `${cleanPublicUrl}/${fileName}`;

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload to R2" }, { status: 500 });
  }
}
