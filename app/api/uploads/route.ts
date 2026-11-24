import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
  let supabase: Awaited<ReturnType<typeof getSupabaseClient>>;
  let userId: string;
  try {
    supabase = await getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to upload a recipe image." },
        { status: 401 },
      );
    }
    userId = user.id;
  } catch (error) {
    console.error("Could not verify upload authorization.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify your sign-in." },
      { status: 500 },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_SIZE + 65536) {
    return NextResponse.json(
      { error: "Images must be smaller than 4 MiB." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Choose an image file to upload." },
      { status: 400 },
    );
  }

  const file = formData.get("image");
  if (file === null || typeof file === "string") {
    return NextResponse.json(
      { error: "Choose an image file to upload." },
      { status: 400 },
    );
  }
  const extension = IMAGE_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP, or GIF image." },
      { status: 400 },
    );
  }
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "Images must be smaller than 4 MiB." },
      { status: 400 },
    );
  }

  try {
    const path = `${userId}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("recipe-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
    return NextResponse.json({ imageUrl: data.publicUrl });
  } catch (error) {
    console.error("Could not upload recipe image.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload the image." },
      { status: 500 },
    );
  }
}
