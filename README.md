# GradeLift — Production Setup & Deployment Guide

## Tech Stack
- Backend: Node.js, Express.js (Serverless on Vercel)
- Database: MongoDB via Mongoose
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
Copy `.env.example` to `.env` (or edit `.env`):
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/gradelift
JWT_SECRET=gradelift_production_jwt_secret_key_2026
```
For MongoDB Atlas, replace `MONGODB_URI` with your connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/gradelift?retryWrites=true&w=majority
```

3. Start the Server:
```bash
npm start
```

4. Open in Browser:
Visit `http://localhost:3000`

## Vercel Deployment

1. Push your project to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. In **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster0.mongodb.net/gradelift?retryWrites=true&w=majority`)
   - `JWT_SECRET`: A secure random string for JWT signing
5. Click **Deploy**.

Vercel will automatically route `/api/*` to the serverless backend function ([api/index.js](api/index.js)) and serve all HTML/CSS/JS frontend pages statically with edge caching.
