# Week 2 Quick Start Guide

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google Vision API (Optional)
If you want to test OCR functionality:

```bash
# Copy and edit .env.local
cp .env.example .env.local
```

Add your Google Vision API key:
```bash
GOOGLE_VISION_API_KEY=your-actual-api-key-here
```

**Note:** The app works without the API key, OCR will gracefully fallback to manual entry.

### 3. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## 📸 Testing Receipt Upload + OCR

### Without API Key (Manual Entry Mode)
1. Go to **Expenses** → **Nieuwe uitgave**
2. Click the upload area
3. Select any image file
4. Form remains empty → Fill manually
5. Works perfectly for testing UI

### With API Key (Full OCR)
1. Go to **Expenses** → **Nieuwe uitgave**
2. Upload a receipt image (JPG/PNG)
3. Wait 2-3 seconds for OCR processing
4. Form auto-fills with extracted data
5. Review and edit if needed
6. Click "Opslaan"

## 🎨 New Features to Explore

### Receipt Upload
- **Drag & Drop**: Drag receipt image onto upload zone
- **Click to Upload**: Click the upload area to browse
- **Preview**: See thumbnail after upload
- **Clear**: Click X to remove and try another

### Expenses List
- **Filter by Category**: Use dropdown to filter
- **View Receipt**: Click camera icon to view full image
- **BTW Summary**: See quarterly BTW totals at top
- **Quarter Selector**: Choose different quarters

### Dashboard
- **BTW Gauge**: Visual progress toward quarterly target
- **Category Pie Chart**: See spending breakdown
- **Trend Chart**: 6-month expense trend
- **Interactive**: Hover over charts for details

## 🧪 Testing Scenarios

### Scenario 1: Happy Path (With OCR)
```
1. Upload clear receipt
2. ✅ Amount extracted correctly
3. ✅ Date filled
4. ✅ Vendor name in description
5. ✅ BTW rate detected (21%)
6. ✅ Category suggested
7. Edit description if needed
8. Save expense
```

### Scenario 2: Manual Entry (Fallback)
```
1. Upload receipt OR skip upload
2. Fill form manually:
   - Description: "Test Expense"
   - Amount: 100.00
   - BTW: 21%
   - Category: Kantoor
   - Date: Today
3. Save expense
```

### Scenario 3: Expense Management
```
1. Go to Expenses page
2. Filter by category: "Software"
3. Click receipt icon → View full receipt
4. Click edit → Modify expense
5. Click delete → Remove expense
```

## 📊 Dashboard Tour

### Top Cards
- **Totaal uitgaven**: Sum excluding BTW
- **BTW te betalen**: Amount due this quarter (blue highlight)
- **Aantal boekingen**: Total expense count

### BTW Liability Gauge
- **Blue**: < 50% of target (€2000)
- **Orange**: 50-80% of target
- **Red**: > 80% of target
- Shows remaining amount to reach target

### Category Pie Chart
- Hover over slices for exact amounts
- Percentages shown on labels
- Color-coded categories

### Monthly Trend
- Last 6 months of expenses
- Interactive tooltips
- Smooth animations

## 🎯 Sample Test Data

The app comes with mock data in the current quarter:
- 5 pre-filled expenses
- Mix of categories
- Different BTW rates (0%, 9%, 21%)
- ~€600 total

## 🐛 Common Issues

### "Geen tekst gevonden op de bon"
- Receipt image quality is poor
- Try a clearer photo
- Or use manual entry

### OCR not triggering
- Check console for API key errors
- Verify `GOOGLE_VISION_API_KEY` is set
- Restart dev server after adding env vars

### Charts not showing
- Make sure you have expenses in current quarter
- Mock data is pre-populated for current quarter
- Change quarter selector if needed

## 💡 Pro Tips

1. **Test OCR**: Use receipt screenshots from Google Images
2. **Mobile Testing**: Open http://localhost:3000 on your phone
3. **Dark Mode**: Not implemented yet (Week 3?)
4. **PDF Receipts**: Upload supported, but no OCR (Vision API limitation)

## 🎬 Quick Demo Flow

```bash
# Terminal 1: Start dev server
npm run dev

# Browser:
1. Login (any email/password - mock auth)
2. Dashboard → See charts and gauge
3. Expenses → Filter by category
4. New Expense → Upload receipt → Auto-fill ✨
5. Save → View in list with thumbnail
6. Click thumbnail → Full receipt view
7. Dashboard → See updated charts
```

## 📚 File Structure

```
/app
  /api/ocr
    route.ts              # OCR endpoint
  /dashboard
    page.tsx              # Charts & gauge
  /expenses
    page.tsx              # List with filters
    /new
      page.tsx            # Upload + form

/components
  receipt-upload.tsx      # Drag-drop component
  /ui
    (shadcn components)

/lib
  types.ts                # TypeScript types
  validations.ts          # Zod schemas
  mock-data.ts            # Sample data
```

## 🔄 Development Workflow

```bash
# Make changes
npm run dev

# Check types
npm run lint

# Build production
npm run build

# Test production build
npm start
```

## ✅ Week 2 Checklist

- [x] Receipt upload component
- [x] Drag-and-drop interface
- [x] OCR API route (Google Vision)
- [x] Smart expense form with auto-fill
- [x] Manual entry fallback
- [x] Expense list with thumbnails
- [x] Category filter
- [x] BTW quarterly totals
- [x] Receipt viewer modal
- [x] Dashboard BTW gauge
- [x] Category pie chart
- [x] Monthly trend chart
- [x] Mobile responsive
- [x] Dutch UI
- [x] TypeScript + Zod validation
- [x] Build succeeds

## 🎉 Ready for Week 3!

All Week 2 features are implemented and working. The app compiles successfully and all Week 1 features remain functional.

**Next:** Integrate Supabase Storage for real file uploads and database persistence.
