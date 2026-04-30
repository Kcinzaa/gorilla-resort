import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  hasSupabaseStorageConfig,
  uploadSupabaseObject,
} from "@/lib/supabaseStorage";

export const runtime = "nodejs";

function createSafeExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function createSlipFileName(extension: string) {
  return `slip-${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบไฟล์สลิป",
        },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP",
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "ไฟล์ต้องมีขนาดไม่เกิน 5MB",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = createSafeExtension(file);
    const fileName = createSlipFileName(extension);

    if (hasSupabaseStorageConfig()) {
      const objectPath = `slips/${new Date().getFullYear()}/${fileName}`;
      const publicUrl = await uploadSupabaseObject({
        buffer,
        contentType: file.type,
        objectPath,
      });

      return NextResponse.json({
        success: true,
        message: "อัปโหลดสลิปสำเร็จ",
        url: publicUrl,
      });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          message:
            "ยังไม่ได้ตั้งค่า Supabase Storage สำหรับอัปโหลดสลิปบน production",
        },
        { status: 500 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "slips");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: "อัปโหลดสลิปสำเร็จ",
      url: `/uploads/slips/${fileName}`,
    });
  } catch (error) {
    console.error("UPLOAD SLIP ERROR:", error);

    const message = error instanceof Error ? error.message : String(error);

    if (message.startsWith("SUPABASE_UPLOAD_FAILED:")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "อัปโหลดสลิปเข้า Supabase Storage ไม่สำเร็จ กรุณาเช็ก SUPABASE_STORAGE_BUCKET และ Service Role Key",
          detail: message.replace("SUPABASE_UPLOAD_FAILED:", "").trim(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถอัปโหลดสลิปได้",
        detail: message,
      },
      { status: 500 }
    );
  }
}
