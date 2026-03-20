# PDFMagic Fix Plans

Individual fix plans for each identified issue.

---

## Issue: Security - PrismJS DOM Clobbering Vulnerability

**Severity:** Critical  
**Location:** `react-syntax-highlighter` → `refractor` → `prismjs`  
**Problem:** DOM Clobbering vulnerability in prismjs < 1.30.0  
**Root Cause:** Transitive dependency prismjs not updated  
**Fix:**
```bash
npm audit fix
# This will update react-syntax-highlighter to 16.1.1 which includes prismjs 1.30.0+
```
**Effort:** 15 minutes

---

## Issue: Security - Shell Injection Risk in PDF Processor

**Severity:** Critical  
**Location:** `src/lib/pdf-processor.ts` lines 64-71  
**Problem:** Using `exec` with potentially unsafe path handling  
**Root Cause:** `exec` with shell interpolation for user files  
**Fix:**

```typescript
// OLD CODE (unsafe)
const { stdout, stderr } = await execAsync(
  `${pythonCmd} "${scriptPath}" ${escapedArgs}`,
  { timeout: 120000 }
);

// NEW CODE (safe)
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

export async function executePythonScript(
  scriptName: string,
  args: string[]
): Promise<{ success: boolean; output?: string; error?: string }> {
  const scriptPath = join(SCRIPTS_DIR, scriptName);
  
  // Create a temp args file to avoid shell injection
  const argsFile = join(UPLOAD_DIR, `args-${randomUUID()}.json`);
  await writeFile(argsFile, JSON.stringify(args));
  
  const env = {
    ...process.env,
    DOWNLOAD_DIR,
    UPLOAD_DIR,
  };
  
  const pythonCmd = process.platform === "win32" ? "py" : "python3";
  
  return new Promise((resolve) => {
    const child = spawn(pythonCmd, [scriptPath, argsFile], {
      env,
      timeout: 120000,
      maxBuffer: 50 * 1024 * 1024,
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    
    child.on('close', async (code) => {
      // Cleanup args file
      try {
        await unlink(argsFile);
      } catch { /* ignore */ }
      
      if (code === 0) {
        try {
          resolve({ success: true, output: JSON.parse(stdout.trim()) });
        } catch {
          resolve({ success: true, output: stdout.trim() });
        }
      } else {
        resolve({ success: false, error: stderr || `Process exited with code ${code}` });
      }
    });
    
    child.on('error', async (err) => {
      try {
        await unlink(argsFile);
      } catch { /* ignore */ }
      resolve({ success: false, error: err.message });
    });
  });
}
```
**Effort:** 2 hours

---

## Issue: TypeScript Build Errors Ignored

**Severity:** Critical  
**Location:** `next.config.ts` line 4  
**Problem:** `ignoreBuildErrors: true` prevents catching type errors  
**Root Cause:** Quick fix for build issues without resolving root cause  
**Fix:**

1. First, identify all TypeScript errors:
```bash
cd C:\Users\riyas\Downloads\MYPROJECT\pdfmagic
npx tsc --noEmit > ts-errors.txt 2>&1
```

2. Fix each error systematically

3. Remove from `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // REMOVE THIS LINE:
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  
  // Keep the rest...
};
```

4. Add to CI/CD pipeline:
```yaml
# .github/workflows/ci.yml
- name: Type check
  run: npx tsc --noEmit
```

**Effort:** 4 hours (to fix all errors)

---

## Issue: Monolithic ToolLayout Component

**Severity:** High  
**Location:** `src/components/pdf/ToolLayout.tsx` (1051 lines)  
**Problem:** Single component handles all 60+ tool types, duplicated switch/case logic  
**Root Cause:** No abstraction for tool-specific UI  
**Fix:**

### Step 1: Create Tool UI Registry

```typescript
// src/components/pdf/tool-ui/index.ts
export interface ToolUIComponent {
  Options?: React.ComponentType<ToolOptionsProps>;
  Result?: React.ComponentType<ToolResultProps>;
}

export interface ToolOptionsProps {
  tool: Tool;
  files: File[];
  onFilesChange: (files: File[]) => void;
  options: Record<string, unknown>;
  setOptions: (options: Record<string, unknown>) => void;
  status: Status;
  progress: number;
}

export interface ToolResultProps {
  result: unknown;
  onDownload: () => void;
  onReset: () => void;
}

// Tool UI components
import { MergeToolUI } from './MergeToolUI';
import { SplitToolUI } from './SplitToolUI';
import { CompressToolUI } from './CompressToolUI';
// etc...

export const toolUIRegistry: Record<string, ToolUIComponent> = {
  merge: { Options: MergeToolUI },
  split: { Options: SplitToolUI },
  compress: { Options: CompressToolUI },
  // ... other tools
};
```

### Step 2: Extract Individual Tool UIs

```typescript
// src/components/pdf/tool-ui/SplitToolUI.tsx
export function SplitToolUI({ 
  files, 
  options, 
  setOptions, 
  status 
}: ToolOptionsProps) {
  const [splitMode, setSplitMode] = useState(options.splitMode || 'ranges');
  
  // Tool-specific state and UI
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Choose how to split your PDF:</h3>
      {/* Split-specific UI */}
    </div>
  );
}
```

### Step 3: Simplify ToolLayout

```typescript
// src/components/pdf/ToolLayout.tsx (refactored)
export function ToolLayout({ tool }: ToolLayoutProps) {
  const toolUI = toolUIRegistry[tool.id];
  const ToolOptions = toolUI?.Options;
  
  return (
    <div>
      {/* Header */}
      <ToolHeader tool={tool} />
      
      {/* File Upload */}
      <FileUpload onFilesSelected={handleFilesSelected} />
      
      {/* Tool-Specific Options */}
      {ToolOptions && (
        <ToolOptions
          tool={tool}
          files={files}
          options={options}
          setOptions={setOptions}
        />
      )}
      
      {/* Process Button */}
      {/* Results */}
    </div>
  );
}
```

**Effort:** 8 hours

---

## Issue: Enable React Strict Mode

**Severity:** High  
**Location:** `next.config.ts` line 6  
**Problem:** `reactStrictMode: false` hides potential React 19 issues  
**Root Cause:** Disabled for perceived dev performance  
**Fix:**

1. Enable temporarily to catch issues:
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true, // Change from false
  // ...
};
```

2. Run dev server and test all features

3. If issues found, fix them:
- Duplicate API calls (use AbortController)
- Stale closures (ensure proper cleanup)
- Effect dependencies (use ESLint warnings)

4. Keep Strict Mode enabled

**Effort:** 2 hours (if no issues found) / 4+ hours (if issues found)

---

## Issue: Distributed Rate Limiting

**Severity:** High  
**Location:** `src/lib/security.ts` lines 10-50  
**Problem:** In-memory Map doesn't work with multiple server instances  
**Root Cause:** Single-instance assumption  
**Fix:**

### Option A: Upstash Redis (Recommended - Free Tier)

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "pdfmagic-ratelimit",
});

export async function checkRateLimit(ip: string) {
  const { success, remaining, reset } = await ratelimit.limit(ip);
  return { 
    allowed: success, 
    remaining, 
    resetIn: reset - Date.now() 
  };
}
```

### Option B: In-Memory Fallback

```typescript
// For development without Redis
const devRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkDevRateLimit(ip: string) {
  const now = Date.now();
  const record = devRateLimitMap.get(ip);
  
  if (!record || record.resetTime < now) {
    devRateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return { allowed: true, remaining: 99, resetIn: 60000 };
  }
  
  if (record.count >= 100) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: 100 - record.count, resetIn: record.resetTime - now };
}
```

**Effort:** 3 hours

---

## Issue: Consolidate Supabase Clients

**Severity:** Medium  
**Location:** Multiple files  
**Problem:** Multiple ways to create Supabase clients  
**Root Cause:** Organic growth without standardization  
**Fix:**

```typescript
// src/lib/supabase/index.ts
export { createClient } from '@supabase/supabase-js';

// Create typed singleton clients
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
}

// Export types
export type { User, Session } from '@supabase/supabase-js';
```

Then update all imports to use centralized client:
```typescript
// Before
import { getSupabaseBrowser } from '@/lib/supabase-auth';

// After
import { getSupabaseBrowser } from '@/lib/supabase';
```

**Effort:** 2 hours

---

## Issue: Major pdfjs-dist Update (4→5)

**Severity:** High  
**Location:** `package.json`, `src/lib/pdf-thumbnail.ts`, etc.  
**Problem:** pdfjs-dist v5 has breaking API changes  
**Root Cause:** Major version bump with rewrite  
**Fix:**

1. Check current usage:
```bash
grep -r "pdfjs-dist" src/ --include="*.ts" --include="*.tsx"
```

2. Read migration guide: https://github.com/mozilla/pdfjs-dist/releases/tag/v5.0.0

3. Key changes:
```typescript
// v4
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = '...';
const pdf = await pdfjs.getDocument(path).promise;
const page = await pdf.getPage(num);

// v5
import { PDFDocumentFactory, PDFReader, GlobalWorkerOptions } from 'pdfjs-dist';
const doc = PDFDocumentFactory.load(input);
const pages = doc.getPages();
```

4. Update in phases, test each change

**Effort:** 4 hours

---

## Issue: recharts v2→v3 Migration

**Severity:** High  
**Location:** Dashboard analytics components  
**Problem:** recharts v3 has API changes  
**Root Cause:** Major version bump  
**Fix:**

1. Read migration guide: https://recharts.org/en-US/guide/Migration

2. Key changes in v3:
- `<AreaChart>` becomes `<AreaChart data={}>`
- `Legend` component changed
- `Tooltip` props updated

3. Test existing charts after update

**Effort:** 3 hours

---

*Generated: March 20, 2026*
