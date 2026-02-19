# PDFMagic - Complete PDF Toolkit

A stunning, feature-rich PDF toolkit web application that rivals and exceeds ilovepdf.com. Built with Next.js 15 and Python for powerful PDF processing capabilities.

![PDFMagic](https://img.shields.io/badge/PDFMagic-PDF%20Toolkit-8B5CF6?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

### 🎨 Modern UI/UX
- **Glassmorphism Design** - Beautiful semi-transparent cards with blur effects
- **Animated Gradients** - Purple/violet/pink color scheme with smooth animations
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode** - Theme toggle with elegant transitions
- **Framer Motion Animations** - Smooth hover effects and transitions

### 📦 25+ PDF Tools

| Category | Tools |
|----------|-------|
| **PDF Tools** | Merge, Split, Compress, PDF to Word/Excel/PPT/Image |
| **Convert to PDF** | Word, Excel, PPT, Image, HTML to PDF |
| **PDF Editing** | Watermark, Page Numbers, Rotate, Crop, Delete Pages, Organize |
| **PDF Security** | Protect, Unlock, Sign, Redact |
| **AI-Powered** | OCR, Compare, Summarize, Chat with PDF |

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Python scripts
- **PDF Processing**: pypdf, pdfplumber, reportlab, pdf2image, pytesseract
- **Document Conversion**: python-docx, openpyxl, python-pptx
- **AI Integration**: z-ai-web-dev-sdk

## 📋 Prerequisites

### System Dependencies (Required for Production)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-chi-sim \
    tesseract-ocr-chi-tra \
    tesseract-ocr-jpn \
    tesseract-ocr-kor \
    poppler-utils \
    libmagic1 \
    libgl1-mesa-glx \
    libglib2.0-0

# For OCR with additional languages
sudo apt-get install -y tesseract-ocr-fra tesseract-ocr-deu tesseract-ocr-spa
```

### Python Packages

```bash
pip install pypdf PyPDF2 pdfplumber reportlab pdf2image pytesseract python-docx openpyxl python-pptx Pillow
```

## 🚀 Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdfmagic
   ```

2. **Install Node.js dependencies**
   ```bash
   bun install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the development server**
   ```bash
   bun run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## 🚢 Deploy to Railway.app

Railway.app is a modern deployment platform that supports both Node.js and Python. Here's how to deploy PDFMagic:

### Option 1: Deploy from GitHub (Recommended)

#### Step 1: Prepare Your Repository

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Create a `requirements.txt` file** (at root level)
   ```txt
   pypdf>=6.0.0
   PyPDF2>=3.0.0
   pdfplumber>=0.10.0
   reportlab>=4.0.0
   pdf2image>=1.16.0
   pytesseract>=0.3.10
   python-docx>=1.1.0
   openpyxl>=3.1.0
   python-pptx>=0.6.21
   Pillow>=10.0.0
   ```

#### Step 2: Create Railway Configuration

Create a `railway.toml` file at the root:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "bun run start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

#### Step 3: Create `nixpacks.toml`

```toml
[phases.setup]
nixPkgs = [
  "python311",
  "python311Packages.pip",
  "tesseract",
  "poppler-utils",
  "ghostscript"
]

[phases.install]
cmds = [
  "bun install",
  "pip install --user -r requirements.txt"
]

[phases.build]
cmds = ["bun run build"]

[start]
cmd = "bun run start"
```

#### Step 4: Deploy on Railway

1. Go to [Railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will auto-detect Next.js and configure the build
6. Add environment variables if needed:
   - `NODE_ENV=production`
   - `PYTHONUNBUFFERED=1`

7. Click **"Deploy"**

#### Step 5: Configure Domain (Optional)

1. Go to your project **Settings**
2. Click **"Generate Domain"** for a free `.app` domain
3. Or add a custom domain

### Option 2: Deploy with Dockerfile

Create a `Dockerfile` at the root:

```dockerfile
# Use Node.js 20 as base
FROM node:20-bullseye

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-chi-sim \
    poppler-utils \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install Node dependencies
RUN bun install --frozen-lockfile

# Copy Python requirements
COPY requirements.txt ./
RUN pip3 install --break-system-packages -r requirements.txt

# Copy application code
COPY . .

# Build the application
RUN bun run build

# Create necessary directories
RUN mkdir -p /app/upload /app/download

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHONUNBUFFERED=1

# Start the application
CMD ["bun", "run", "start"]
```

Deploy using Railway's Dockerfile option:
1. Create new project → **"Deploy from GitHub"**
2. Railway will detect the Dockerfile
3. Set root directory to `./`
4. Deploy!

### Option 3: One-Click Deploy

Click the button below to deploy to Railway:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## 🔧 Environment Variables

Create a `.env` file for local development or set in Railway:

```env
# Application
NODE_ENV=development
PORT=3000

# Python
PYTHONUNBUFFERED=1

# Optional: AI Features (for z-ai-web-dev-sdk)
# ZAI_API_KEY=your-api-key

# File Storage (optional - defaults to local paths)
# UPLOAD_DIR=/app/upload
# DOWNLOAD_DIR=/app/download
```

## 📁 Project Structure

```
pdfmagic/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── tool/[id]/            # Dynamic tool pages
│   │   └── api/
│   │       ├── pdf/              # PDF API routes
│   │       │   ├── merge/
│   │       │   ├── split/
│   │       │   ├── compress/
│   │       │   ├── ocr/
│   │       │   ├── summarize/
│   │       │   └── ...           # 26 API endpoints
│   │       └── download/         # File download route
│   ├── components/
│   │   ├── pdf/                  # PDF toolkit components
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ToolCard.tsx
│   │   │   ├── ToolLayout.tsx
│   │   │   └── ...
│   │   └── ui/                   # shadcn/ui components
│   └── lib/
│       ├── tools-config.ts       # Tool definitions
│       ├── pdf-processor.ts      # PDF processing utilities
│       └── utils.ts
├── scripts/                      # Python processing scripts
│   ├── merge_pdf.py
│   ├── split_pdf.py
│   ├── compress_pdf.py
│   ├── ocr_pdf.py
│   ├── compare_pdf.py
│   └── ...                       # 24 Python scripts
├── upload/                       # Uploaded files (temp)
├── download/                     # Processed files (output)
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Docker configuration
├── railway.toml                  # Railway configuration
├── nixpacks.toml                 # Nixpacks configuration
└── package.json
```

## 🔍 OCR (Optical Character Recognition)

The OCR feature requires **Tesseract OCR** to be installed on the server.

### Installing Tesseract on Production Servers

#### Ubuntu/Debian
```bash
sudo apt-get install -y tesseract-ocr tesseract-ocr-eng
```

#### Additional Languages
```bash
# Chinese
sudo apt-get install -y tesseract-ocr-chi-sim tesseract-ocr-chi-tra

# Japanese & Korean
sudo apt-get install -y tesseract-ocr-jpn tesseract-ocr-kor

# European Languages
sudo apt-get install -y tesseract-ocr-fra tesseract-ocr-deu tesseract-ocr-spa
```

#### Verify Installation
```bash
tesseract --version
tesseract --list-langs
```

### Tesseract in Railway.app

Railway uses Nixpacks for builds. Add Tesseract via `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["tesseract", "tesseractBase", "poppler-utils"]
```

Or use the Dockerfile approach which includes Tesseract installation.

## 🧪 Testing

```bash
# Run linter
bun run lint

# Build for production
bun run build

# Test Python scripts
python3 scripts/merge_pdf.py test1.pdf test2.pdf
```

## 🐛 Troubleshooting

### Python Scripts Not Found
- Ensure Python scripts are in `/scripts/` directory
- Check file permissions: `chmod +x scripts/*.py`

### PDF Processing Errors
- Install Poppler: `sudo apt-get install poppler-utils`
- Check Python packages: `pip list | grep pdf`

### OCR Not Working
- Install Tesseract: `sudo apt-get install tesseract-ocr`
- Check language packs: `tesseract --list-langs`

### Memory Issues with Large Files
- Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"`
- Configure Railway to use larger instance

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js and Python
# Build Mon Feb 16 20:51:38 UTC 2026
# Deployment fix
# Railway redeploy trigger
