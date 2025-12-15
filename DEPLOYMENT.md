# Deployment Guide

## Quick Deploy (Free Tier)

### 1. Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repo: `jayanth922/Grasp`
4. Configure:
   - **Name**: grasp-api
   - **Root Directory**: (leave empty)
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   GROQ_API_KEY=gsk_...
   TAVILY_API_KEY=tvly-...
   NEO4J_URI=neo4j+s://...
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=...
   ```

6. Click **Create Web Service**
7. Copy your backend URL (e.g., `https://grasp-api.onrender.com`)

---

### 2. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **Add New** → **Project**
3. Import `jayanth922/Grasp`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`

5. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://grasp-api.onrender.com
   ```
   (Use your Render backend URL from step 1)

6. Click **Deploy**

---

### 3. Test Your Deployment

- Frontend: `https://grasp.vercel.app` (or your Vercel URL)
- Backend: `https://grasp-api.onrender.com/api/health`

---

## Free Tier Limits

| Service | Monthly Free |
|---------|--------------|
| Vercel | 100GB bandwidth, unlimited deploys |
| Render | 750 hours (spins down after 15min inactive) |
| Neo4j Aura | 200K nodes, 400K relationships |
| Groq | 100K tokens/day |

---

## Notes

- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- For always-on, upgrade to Render paid ($7/month)
