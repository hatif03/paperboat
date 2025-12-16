# Paperboat - AI Video Storyboarding

> Direct Your Video Frame by Frame

AI-powered video storyboarding that transforms sketches into context-aware video clips. Draw, prompt, generate—infinitely.

## Architecture

```
┌─────────────────┐
│  Next.js App    │  (frontend/)
│  - Canvas UI    │
│  - Auth Pages   │
│  - Dashboard    │
└────────┬────────┘
         │ HTTP API
         │ (Bearer Token)
         ▼
┌─────────────────┐
│  Motia Backend  │  (src/)
│  - API Steps    │
│  - Event Steps  │
│  - Services     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌─────────┐ ┌──────┐
│Supabase│ │Redis │ │Vertex AI│ │GCS   │
│(Auth+  │ │(Jobs)│ │(Video/  │ │(Files)│
│Credits)│ │      │ │Image)   │ │      │
└────────┘ └──────┘ └─────────┘ └──────┘
```

## Features

| Feature | Description |
|---------|-------------|
| 🎨 **Interactive Canvas** | Draw instructions directly on frames using Tldraw |
| 🤖 **AI Video Generation** | Powered by Google Vertex AI (Veo 3.1 & Gemini 2.5) |
| 🔗 **Frame-by-Frame Workflow** | Sequential frames connected by arrows build your story |
| ⚡ **Image Enhancement** | AI-powered frame improvement on demand |
| 🎬 **Video Merging** | Combine clips into seamless sequences |

## Prerequisites

- Node.js 18+
- Redis (local or hosted) - optional, Motia has built-in memory server
- Google Cloud Project (Vertex AI enabled)
- Supabase project

## Setup

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```env
# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_BUCKET_NAME=your-gcs-bucket-name

# Redis (optional - leave empty to use Motia's built-in memory server)
# REDIS_URL=redis://default:password@localhost:6379

# Supabase (auth & database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

3. Set up Google Cloud authentication:
```bash
gcloud auth application-default login
```

4. Generate types:
```bash
npm run generate-types
```

5. Start the backend:
```bash
npm run dev
```

The backend will be available at http://localhost:3000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

4. Start the frontend:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## Supabase Setup

1. Create a Supabase project at https://supabase.com

2. Enable auth providers (Google/GitHub) in the Supabase dashboard

3. Create the required database tables:
   - `enums.sql` - Required enum types
   - `functions.sql` - Required functions (like `sub_user_credits`)

4. Create a `profiles` table with:
   - `user_id` (UUID, references auth.users)
   - `credits` (INTEGER)
   - `billing_type` (TEXT, 'free' or 'paid')

5. Create a `transaction_log` table with:
   - `transaction_log_id` (UUID, primary key)
   - `user_id` (UUID, references auth.users)
   - `transaction_type` (TEXT)
   - `credit_usage` (INTEGER)
   - `created_at` (TIMESTAMP)

## API Endpoints

### Video Generation
- `POST /video` - Start a video generation job
- `GET /video/:jobId` - Get job status

### Image Enhancement
- `POST /image` - Enhance an image using AI

### Context Extraction
- `POST /extract-context` - Extract scene information from video

### Video Merging
- `POST /video/merge` - Merge multiple videos

### File Upload
- `PUT /video/:itemName` - Upload a video file

### Health Check
- `GET /health` - Check service health

## Development

### Backend Commands
```bash
npm run dev          # Start development server with hot reload
npm run start        # Start production server
npm run generate-types # Generate TypeScript types
npm run build        # Build for production
```

### Frontend Commands
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # Run linter
```

## Project Structure

```
.
├── src/                    # Motia backend
│   ├── api/               # API Steps (HTTP endpoints)
│   │   ├── video/         # Video-related endpoints
│   │   ├── image/         # Image-related endpoints
│   │   └── files/         # File upload endpoints
│   ├── events/            # Event Steps (background tasks)
│   │   └── video/         # Video processing events
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── middlewares/           # Motia middlewares
├── frontend/              # Next.js frontend
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities and clients
│   └── types/            # TypeScript types
├── motia.config.ts       # Motia configuration
└── package.json          # Backend dependencies
```

## License

MIT
