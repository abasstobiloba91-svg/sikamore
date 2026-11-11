import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. RUTHLESSLY CLEAN CREDENTIALS
    // Account IDs are only letters and numbers
    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").replace(/[^a-zA-Z0-9]/g, "");
    
    // Keys can have special characters, so we ONLY remove spaces and hidden line-breaks
    const accessKey = (process.env.CLOUDFLARE_ACCESS_KEY_ID || "").replace(/\s+/g, "");
    const secretKey = (process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "").replace(/\s+/g, "");
    
    // Bucket names MUST be lowercase and have no spaces/underscores. This forces it to be valid.
    const rawBucketName = process.env.CLOUDFLARE_BUCKET_NAME || "ssikamore-assets";
    const bucketName = rawBucketName.toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (!accountId || !accessKey || !secretKey || !bucketName) {
      throw new Error("Missing credentials in Vercel Environment Variables.");
    }

    // 2. INITIALIZE CLIENT
    const s3Client = new S3Client({
      region: "auto", 
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    // 3. PROCESS FILE
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a 100% safe filename (only numbers, lowercase letters, and dots)
    const fileExt = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileName = `${Date.now()}-${randomString}.${fileExt || 'jpg'}`;

    // 4. SEND TO CLOUDFLARE
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      })
    );

    // 5. GENERATE PUBLIC URL
    const cleanPublicUrl = (process.env.CLOUDFLARE_PUBLIC_URL || "").replace(/\s+/g, "").replace(/\/$/, "");
    const publicUrl = `${cleanPublicUrl}/${fileName}`;

    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error("Upload error details:", error);
    // Send back the EXACT error to help debugging if it fails again
    return NextResponse.json({ error: error.message || "Failed to upload to R2" }, { status: 500 });
  }
}
