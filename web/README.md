# Complaint Triage Assistant — Web App

A front-end for the financial complaint NLP classifier in the parent project.
It lets anyone:

- Classify a **single complaint** and see the predicted product, suggested team,
  priority, and a triage note.
- Upload a **CSV of complaints** for batch classification, view a summary by
  category, and download the triaged results.

## Architecture

```
web/
├── app/                       Next.js (App Router) front-end
│   ├── page.tsx               UI: single complaint + batch CSV tabs
│   ├── lib.ts                 API client, category metadata, examples
│   ├── layout.tsx
│   └── globals.css            Tailwind v4
├── api/
│   └── predict.py             Python serverless function (model inference)
├── complaint_classifier.joblib  Model copy bundled into the function
├── requirements.txt           Pinned inference deps (must match training env)
└── vercel.json                Function memory / duration / includeFiles
```

The CSV is parsed **in the browser** (papaparse); only the chosen complaint-text
column is sent to `/api/predict` as a JSON array `{ "texts": [...] }`. The Python
function returns one triage result per text. Single and batch use the same
endpoint (single = a one-element array).

### Why the model is duplicated here

`vercel.json` uses `includeFiles` to bundle `complaint_classifier.joblib` into the
serverless function. Vercel only packages files inside this app directory, so the
model is copied here from `../models/`. **If you retrain the model, re-copy it:**

```bash
cp ../models/complaint_classifier.joblib ./complaint_classifier.joblib
```

The pinned versions in `requirements.txt` (scikit-learn 1.8.0, etc.) must match
the environment that produced the `.joblib`, or it will fail to unpickle.

## Run locally

Front-end only (the Python API will NOT respond under `next dev`):

```bash
npm install
npm run dev          # http://localhost:3000
```

Full stack locally (front-end **and** the Python function) needs the Vercel CLI:

```bash
npm install -g vercel
vercel dev           # serves both the UI and /api/predict
```

Quick check the model loads / inference works without any server:

```bash
python api/predict.py
```

## Deploy to Vercel

From inside this `web/` directory:

```bash
npm install -g vercel      # one time
vercel login               # opens browser, free account
vercel                     # first run: creates the project (accept defaults)
vercel --prod              # promote to a production URL
```

When prompted on the first `vercel` run:

- **Set up and deploy?** Yes
- **Which scope?** your account
- **Link to existing project?** No
- **Project name?** accept default (or pick one)
- **In which directory is your code located?** `./` (you are already in `web/`)
- Accept the auto-detected **Next.js** settings.

Vercel installs `requirements.txt` for the Python function automatically and
bundles the model via `includeFiles`. The default Python runtime is 3.12, which
matches the pinned dependencies. (If you ever need to change it, set the Python
version under Project → Settings → Functions in the Vercel dashboard.)
