// Client-safe demo mode utilities

export const DEMO_USER_ID = 'demo-user-001';

export const isDemoMode = () => process.env.DEMO_MODE === 'true';

export const DEMO_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB max file size for demo
  maxRequestsPerMinute: 5, // Rate limit: 5 requests per minute
  cleanupDelay: 5 * 60 * 1000, // Clean up demo files after 5 minutes
};

export function getDemoFileSizeLimit(): string {
  const mb = DEMO_CONFIG.maxFileSize / (1024 * 1024);
  return `${mb} MB`;
}

export function validateDemoFileSize(fileSize: number): boolean {
  return fileSize <= DEMO_CONFIG.maxFileSize;
}
