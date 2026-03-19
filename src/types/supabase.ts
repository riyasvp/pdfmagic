export interface SupabaseUploadResponse {
  url: string | null;
  error: string | null;
}

export interface SupabaseStorageError {
  message: string;
  statusCode?: number;
}
