import { readFile } from "fs/promises";
import { supabaseServer } from "@/lib/supabase-server";
import type { SupabaseUploadResponse } from "@/types/supabase";
import { DEMO_USER_ID, isDemoMode } from "@/lib/supabase-auth";
import { DEMO_CONFIG } from "@/lib/demo-utils";
import { cleanupFile } from "./pdf-processor";

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME ?? "pdf-edits";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadToSupabase(
  filePath: string,
  fileName: string,
  userId: string
): Promise<SupabaseUploadResponse> {
  if (!supabaseServer) {
    return { url: null, error: "Supabase not configured" };
  }

  const isDemo = isDemoMode() || userId === DEMO_USER_ID;
  const fullPath = isDemo
    ? `demo/${Date.now()}_${fileName}`
    : `${userId}/${fileName}`;

  if (isDemo) {
    console.log(`[Demo Mode] Uploading to shared demo folder: ${fullPath}`);
  }

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const fileBuffer = await readFile(filePath);
      const uint8Array = new Uint8Array(fileBuffer);

      const { error } = await supabaseServer.storage
        .from(BUCKET_NAME)
        .upload(fullPath, uint8Array, {
          contentType: "application/pdf",
          upsert: true,
          metadata: { owner_id: userId, isDemo: isDemo },
        });

      if (error) {
        lastError = error.message;
        console.error(`Upload attempt ${attempt} failed:`, error.message);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }
        
        return { url: null, error: error.message };
      }

// Generate absolute public URL (avoids relative URL issues)
   const bucketBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
     "https://", "https://"
   )?.replace(".co", ".co/storage/v1/object/public") + `/${BUCKET_NAME}`;

  const absoluteUrl = bucketBaseUrl ? `${bucketBaseUrl}/${fullPath}` : urlData.publicUrl;

  // Schedule demo file cleanup
  if (isDemo) {
    await scheduleDemoCleanup(filePath);
  }

  return { url: absoluteUrl, error: null };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown upload error";
      console.error(`Upload attempt ${attempt} error:`, lastError);
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        await delay(RETRY_DELAY_MS * attempt);
        continue;
      }
    }
  }

  return { url: null, error: lastError || "Upload failed after retries" };
}

export async function cleanupDemoFile(filePath: string): Promise<void> {
  try {
    await cleanupFile(filePath);
    console.log(`[Demo Mode] Cleaned up file: ${filePath}`);
  } catch (error) {
    console.error(`[Demo Mode] Failed to cleanup file: ${filePath}`, error);
  }
}

export async function scheduleDemoCleanup(filePath: string): Promise<void> {
  if (!isDemoMode()) return;
  
  setTimeout(async () => {
    await cleanupDemoFile(filePath);
  }, DEMO_CONFIG.cleanupDelay);
}
