import { readFile } from "fs/promises";
import { supabaseServer } from "@/lib/supabase-server";
import type { SupabaseUploadResponse } from "@/types/supabase";
import { DEMO_USER_ID, isDemoMode } from "./supabase-auth";

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME ?? "pdf-edits";

export async function uploadToSupabase(
  filePath: string,
  fileName: string,
  userId: string
): Promise<SupabaseUploadResponse> {
  // Skip if Supabase is not configured
  if (!supabaseServer) {
    return { url: null, error: "Supabase not configured" };
  }

  try {
    const fileBuffer = await readFile(filePath);
    const uint8Array = new Uint8Array(fileBuffer);

    // In demo mode, use a shared demo folder with unique filenames
    const isDemo = isDemoMode() || userId === DEMO_USER_ID;
    const fullPath = isDemo
      ? `demo/${Date.now()}_${fileName}`
      : `${userId}/${fileName}`;

    if (isDemo) {
      console.log(`[Demo Mode] Uploading to shared demo folder: ${fullPath}`);
    }

    const { error } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(fullPath, uint8Array, {
        contentType: "application/pdf",
        upsert: true,
        metadata: { owner_id: userId, isDemo: isDemo },
      });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: urlData } = supabaseServer.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fullPath);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown upload error";
    console.error("Supabase upload error:", errorMessage);
    return { url: null, error: errorMessage };
  }
}
