# Deploying TruthDNA on Render (Step-by-Step Guide)

Render offers **Free Tier hosting** for both Python/Django Web Services and Vite/React Static Sites.

---

## ⚡ Method 1: 1-Click Blueprint (Recommended)

Because we have added [`render.yaml`](file:///c:/Users/DELL/.gemini/antigravity/scratch/LuminaLens/truthdna/render.yaml) to your repository, Render can deploy both the Backend and Frontend together automatically!

### Steps:
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and log in.
2. Click **New +** (top right) $\rightarrow$ select **Blueprint**.
3. Connect your GitHub repository: `gaganrai200505-rgb/c2c_aura`.
4. Render will read `render.yaml` and discover two services:
   * **`truthdna-backend`** (Python Web Service)
   * **`truthdna-frontend`** (Static Site)
5. Under **Environment Variables**, fill in your **`GEMINI_API_KEY`**.
6. Click **Apply**.
7. Render will automatically build and deploy both services!

---

## 🛠️ Method 2: Manual Deployment (Step-by-Step)

If you prefer deploying the Backend and Frontend manually:

### Step 1: Deploy Django Backend (Web Service)
1. On Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Select repository: `gaganrai200505-rgb/c2c_aura`.
3. Configure the settings:
   * **Name**: `truthdna-backend`
   * **Language**: `Python 3`
   * **Region**: `Oregon (US West)` or nearest
   * **Root Directory**: `backend`
   * **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py makemigrations --noinput && python manage.py migrate --noinput && python manage.py collectstatic --noinput
     ```
   * **Start Command**:
     ```bash
     gunicorn truthdna_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
     ```
   * **Instance Type**: `Free`
4. Add **Environment Variables** under the "Environment" tab:
   * `PYTHON_VERSION`: `3.11.9`
   * `GEMINI_API_KEY`: `<Your_Gemini_API_Key>`
   * `DJANGO_SECRET_KEY`: `<Any_Random_String>`
   * `ALLOWED_HOSTS`: `*`
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://truthdna-backend.onrender.com`).

---

### Step 2: Deploy Vite Frontend (Static Site)
1. On Render Dashboard, click **New +** $\rightarrow$ **Static Site**.
2. Select repository: `gaganrai200505-rgb/c2c_aura`.
3. Configure the settings:
   * **Name**: `truthdna-frontend`
   * **Root Directory**: `vite-frontend`
   * **Build Command**:
     ```bash
     npm install && npm run build
     ```
   * **Publish Directory**: `dist`
4. Under **Redirects/Rewrites**:
   * Add a Rewrite rule:
     * **Type**: `Rewrite`
     * **Source**: `/*`
     * **Destination**: `/index.html`
5. Under **Environment Variables**:
   * `VITE_API_URL`: `https://truthdna-backend.onrender.com` *(paste your backend URL from Step 1)*
6. Click **Create Static Site**.

---

## 🔒 Post-Deployment Checklist

1. **Test Health Endpoint**:
   Visit `https://<your-backend-name>.onrender.com/health` $\rightarrow$ should return `{"status": "ok", ...}`.
2. **Test Admin Panel**:
   Visit `https://<your-backend-name>.onrender.com/admin/`.
   *(To create an admin superuser on Render: go to your backend service $\rightarrow$ Shell $\rightarrow$ run `python manage.py createsuperuser`)*.
3. **Open Frontend**:
   Visit `https://<your-frontend-name>.onrender.com` and test a sample URL or claim!
