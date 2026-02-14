# ZZP Tax - BTW Administratie voor ZZP'ers

Automatische bonscanner, BTW-berekening en kwartaalrapporten voor Nederlandse ZZP'ers.

## 🚀 Features

- ✅ **Bonscanner met AI** - Scan bonnetjes, automatische data-extractie (bedrag, datum, BTW)
- ✅ **BTW-berekening** - Automatische berekening van alle BTW-rubrieken (0%, 9%, 21%)
- ✅ **Kwartaalrapporten** - Genereer BTW-rapport met PDF export in 30 seconden
- ✅ **Dashboard met grafieken** - Inzicht in uitgaven per categorie en periode
- ✅ **Categorieën beheer** - Organiseer uitgaven naar eigen inzicht
- ✅ **Veilig & GDPR-compliant** - Data versleuteld opgeslagen in EU

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **OCR**: Google Cloud Vision API
- **PDF**: @react-pdf/renderer
- **Charts**: Recharts
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ en npm/yarn
- Supabase account (gratis tier werkt prima)
- Google Cloud account voor OCR (optioneel, maar aanbevolen)

## 🚀 Setup Instructies

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd zzp-tax-app
npm install
```

### 2. Supabase Project Setup

#### A. Create Project
1. Ga naar [Supabase Dashboard](https://app.supabase.com/)
2. Klik "New Project"
3. Kies een naam, database wachtwoord, en regio (EU voor GDPR)
4. Wacht tot project is aangemaakt (~2 minuten)

#### B. Database Schema
Ga naar SQL Editor in Supabase en run het volgende SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_incl DECIMAL(10,2) NOT NULL,
  amount_excl DECIMAL(10,2) NOT NULL,
  btw_amount DECIMAL(10,2) NOT NULL,
  btw_rate VARCHAR(2) NOT NULL CHECK (btw_rate IN ('0', '9', '21')),
  date DATE NOT NULL,
  vendor VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BTW Reports table
CREATE TABLE btw_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  total_excl DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_btw DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_incl DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'concept' CHECK (status IN ('concept', 'final', 'submitted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, quarter)
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Indexes for performance
CREATE INDEX expenses_user_id_idx ON expenses(user_id);
CREATE INDEX expenses_date_idx ON expenses(date);
CREATE INDEX expenses_year_quarter_idx ON expenses(year, quarter);
CREATE INDEX btw_reports_user_id_idx ON btw_reports(user_id);
CREATE INDEX categories_user_id_idx ON categories(user_id);

-- Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE btw_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own expenses" 
  ON expenses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" 
  ON expenses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" 
  ON expenses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" 
  ON expenses FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" 
  ON btw_reports FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" 
  ON btw_reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" 
  ON btw_reports FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own categories" 
  ON categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" 
  ON categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" 
  ON categories FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" 
  ON categories FOR DELETE 
  USING (auth.uid() = user_id);
```

#### C. Authentication Setup
1. Ga naar Authentication → Providers
2. Enable Email provider (is standaard aan)
3. (Optioneel) Configure email templates naar eigen stijl
4. (Optioneel) Enable Google/Microsoft OAuth

### 3. Google Vision API (Optioneel maar aanbevolen)

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project of selecteer bestaande
3. Enable "Cloud Vision API":
   - Search for "Vision API"
   - Click "Enable"
4. Create API Key:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - **BELANGRIJK**: Click "Restrict Key":
     - API restrictions → Select "Cloud Vision API"
     - (Optioneel) Application restrictions voor extra security
5. Copy de API key

### 4. Environment Variables

```bash
# Copy de example file
cp .env.example .env.local

# Edit .env.local en vul in:
# - NEXT_PUBLIC_SUPABASE_URL (from Supabase project settings)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase project settings)
# - GOOGLE_VISION_API_KEY (from Google Cloud Console)
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## 🚢 Deployment (Vercel)

### Via Vercel Dashboard (Aanbevolen)

1. Push je code naar GitHub/GitLab/Bitbucket
2. Ga naar [Vercel Dashboard](https://vercel.com/new)
3. Import je repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_VISION_API_KEY`
5. Click "Deploy"

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables (first time only)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GOOGLE_VISION_API_KEY

# Deploy to production
vercel --prod
```

### Health Check

Na deployment, check of alles werkt:
```
https://your-app.vercel.app/api/health
```

Zou JSON moeten returnen met `"status": "healthy"`.

## 📁 Project Structure

```
zzp-tax-app/
├── app/
│   ├── api/              # API routes
│   │   ├── health/       # Health check endpoint
│   │   ├── ocr/          # Receipt scanning (with rate limiting)
│   │   ├── reports/      # BTW report generation
│   │   └── categories/   # Category management
│   ├── dashboard/        # Main dashboard (charts, stats)
│   ├── expenses/         # Expenses CRUD pages
│   ├── reports/          # BTW reports pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui components + custom
│   │   ├── error-boundary.tsx
│   │   ├── skeleton.tsx  # Loading skeletons
│   │   └── empty-state.tsx
│   └── layout/           # Layout components
├── lib/
│   ├── api-schemas.ts    # Zod validation schemas
│   ├── rate-limit.ts     # Rate limiting logic
│   ├── btw-calculations.ts # BTW calculation helpers
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## 🔒 Security

- ✅ Row Level Security (RLS) enabled op alle Supabase tables
- ✅ Zod validation op alle API endpoints
- ✅ Rate limiting op OCR endpoint (20 req/min per IP)
- ✅ HTTPS only in production
- ✅ Environment variables nooit in code
- ✅ GDPR-compliant (EU servers, data portability)

## 🐛 Troubleshooting

### "Database connection failed" bij health check
- Check of `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY` correct zijn
- Check of Supabase project actief is (niet gepauzeerd)
- Check of RLS policies correct zijn aangemaakt

### OCR werkt niet
- Check of `GOOGLE_VISION_API_KEY` is ingesteld
- Check of Vision API is enabled in Google Cloud
- Check of API key restrictions correct zijn (moet Vision API mogen gebruiken)
- Zonder API key: OCR is disabled, maar app werkt nog steeds (handmatige invoer)

### "Too many requests" bij uploaden
- Rate limit is 20 requests per minuut per IP
- Dit is normaal en voorkomt misbruik
- Wacht 1 minuut en probeer opnieuw

### Styling ziet er raar uit
- Run `npm install` om zeker te zijn dat alle dependencies installed zijn
- Check of Tailwind config correct is
- Hard refresh browser (Cmd+Shift+R of Ctrl+Shift+F5)

## 📝 License

MIT License - zie LICENSE file voor details

## 🤝 Contributing

Contributions welcome! Open een issue of pull request.

## 📧 Support

Voor vragen of problemen:
- Open een GitHub issue
- Email: support@zzptax.nl (als je dit daadwerkelijk deploy)

---

Gemaakt met ❤️ voor Nederlandse ZZP'ers
