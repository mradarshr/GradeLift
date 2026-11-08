# GradeLift — Production Setup & Deployment Guide

## Tech Stack
- Backend: Node.js, Express.js (Serverless on Vercel)
- Database: MongoDB via Mongoose (Database: `GradeLift`)
- AI Engine: GradeLift AI Worker (`clworker.js`)
- Authentication: JSON Web Tokens (JWT), bcryptjs password hashing
- Frontend: HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, Chart.js, Nunito Sans font

## Prerequisites
- Node.js (v18+)
- MongoDB instance (local MongoDB service or MongoDB Atlas cloud connection)

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
AI_WORKER_URL=https://gradelift-ai-worker.yourname.workers.dev
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

## GradeLift AI Worker Deployment (`clworker.js`)

GradeLift features a dedicated AI Quiz Generator & Answer Evaluator script ([clworker.js](clworker.js)).

### Deploying the Worker:
1. Deploy `clworker.js` as an edge worker service.
2. Bind AI models (`@cf/meta/llama-3.1-8b-instruct`) with variable name `AI`.
3. Set your deployed URL in `AI_WORKER_URL` inside `.env` (and Vercel environment variables).

*Note: If `AI_WORKER_URL` is empty, GradeLift automatically uses its built-in intelligent GradeLift AI synthesis and rubric evaluation engine.*

## Vercel Deployment

1. Push your project to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. In **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (ensure database is `GradeLift`)
   - `JWT_SECRET`: A secure random string for JWT signing
   - `AI_WORKER_URL`: Your deployed GradeLift AI Worker URL (optional)
5. Click **Deploy**.

Vercel will automatically route `/api/*` to the serverless backend function ([api/index.js](api/index.js)) and serve all HTML/CSS/JS frontend pages statically with edge caching.
