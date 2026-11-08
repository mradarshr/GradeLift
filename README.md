# GradeLift — Production Setup & Deployment Guide

## Tech Stack
- Backend: Node.js, Express.js (Serverless on Vercel)
- Database: MongoDB via Mongoose (Database: `GradeLift`)
- AI Worker: Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`)
- Authentication: JSON Web Tokens (JWT), bcryptjs password hashing
- Frontend: HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, Chart.js, Nunito Sans font

## Prerequisites
- Node.js (v18+)
- MongoDB instance (local MongoDB service or MongoDB Atlas cloud connection)
- (Optional) Cloudflare account for Cloudflare Workers AI

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Environment:
Copy `.env.example` to `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/GradeLift
JWT_SECRET=gradelift_production_jwt_secret_key_2026
CLOUDFLARE_WORKER_URL=https://gradelift-ai-worker.yourname.workers.dev
```

For MongoDB Atlas, replace `MONGODB_URI` with your connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/GradeLift?retryWrites=true&w=majority
```

3. Start the Server:
```bash
npm start
```

4. Open in Browser:
Visit `http://localhost:3000`

## Cloudflare AI Worker Deployment (`clworker.js`)

GradeLift features a dedicated AI Quiz Generator & Answer Evaluator running on Cloudflare Workers AI.

### Option A: Cloudflare Dashboard (No CLI needed)
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com) &gt; **Workers & Pages**.
2. Click **Create Application** &gt; **Create Worker**.
3. Name it `gradelift-ai-worker` and click **Deploy**.
4. Click **Quick Edit** in the Worker editor.
5. Copy all contents of [clworker.js](clworker.js) and paste it into the editor.
6. Click **Save and Deploy**.
7. Go to Worker **Settings** &gt; **Bindings** &gt; Add **Workers AI** binding with variable name `AI`.
8. Copy your Worker URL (e.g., `https://gradelift-ai-worker.yourname.workers.dev`) and set `CLOUDFLARE_WORKER_URL` in your `.env` (and Vercel settings).

### Option B: Wrangler CLI
```bash
npm install -g wrangler
wrangler login
wrangler deploy clworker.js --name gradelift-ai-worker --compatibility-date 2024-04-05
```

*Note: If `CLOUDFLARE_WORKER_URL` is empty, GradeLift automatically falls back to its built-in intelligent quiz synthesis and rubric evaluation engine.*

## Vercel Deployment

1. Push your project to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. In **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (ensure database is `GradeLift`)
   - `JWT_SECRET`: A secure random string for JWT signing
   - `CLOUDFLARE_WORKER_URL`: Your deployed Cloudflare Worker URL (optional)
5. Click **Deploy**.

Vercel will automatically route `/api/*` to the serverless backend function ([api/index.js](api/index.js)) and serve all HTML/CSS/JS frontend pages statically with edge caching.
