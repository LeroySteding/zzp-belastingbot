# User Guide: New Advanced Features

## 🎯 Quick Overview

Five powerful new features have been added to help you manage your ZZP administration even better:

1. **KOR Check** - See if you qualify for simplified tax rules
2. **Bank Import** - Import transactions directly from your bank
3. **Recurring Expenses** - Track subscriptions and recurring costs
4. **BTW Deadline Alerts** - Never miss a deadline again
5. **CSV Export** - Export your data for accounting software

---

## 1. 📊 KOR Check (Kleineondernemersregeling)

### What is KOR?
The KOR is a Dutch tax simplification for small businesses with annual revenue under €20,000. If you qualify, you:
- Don't need to file BTW declarations
- Have simpler administration
- Save time on bookkeeping

### How to Use

#### On Dashboard
When you open the dashboard, you'll see a **blue banner** if you might qualify:

> "Je komt mogelijk in aanmerking voor de KOR!"

Click **"Meer informatie"** to see:
- Your estimated annual revenue
- How close you are to the €20,000 limit
- Benefits and requirements
- Link to Belastingdienst for official info

#### In Settings
1. Go to **Instellingen** (gear icon in sidebar)
2. Scroll to **"Kleineondernemersregeling (KOR)"** section
3. Toggle **"KOR ingeschakeld"** if you use KOR
4. View benefits and warnings below the toggle

**Note**: This is an estimate based on your expenses. Always consult a tax advisor before applying for KOR.

---

## 2. 💳 Bank Statement Import

### Supported Banks
- ING
- Rabobank
- ABN AMRO
- Other banks (generic parser)

### How to Import

1. **Get Your Bank Statement**
   - Log into your online banking
   - Download transactions as **CSV** file
   - Recommended: Download 1 month or 1 quarter at a time

2. **Upload to ZZP Tax**
   - Click **"Importeren"** in the sidebar (new!)
   - Click **"Browse"** and select your CSV file
   - Click **"Upload en analyseer"**

3. **Review Transactions**
   The app will:
   - Detect your bank automatically
   - Parse all transactions
   - Suggest categories (Software, Travel, Office, etc.)
   - Assign BTW rates (21% or 9%)
   
   You'll see each transaction with:
   - Description from your bank
   - Suggested category (you can change it)
   - Suggested BTW rate (you can adjust)

4. **Edit if Needed**
   - Review each transaction
   - Change category using dropdown
   - Adjust BTW percentage if wrong
   - Only business expenses are imported

5. **Confirm Import**
   - Click **"Bevestig en importeer X transacties"**
   - Transactions are added to your expenses
   - You'll be redirected to Expenses page

### Smart Categorization Examples

| Description Contains | Category | BTW |
|---------------------|----------|-----|
| "Adobe", "Microsoft", "Google" | Software | 21% |
| "KPN", "Vodafone", "Ziggo" | Telefoon/Internet | 21% |
| "NS", "Taxi", "Shell", "BP" | Reizen | 9% |
| "Verzekering" | Verzekeringen | 21% |
| "Staples", "HEMA", "Action" | Kantoor | 21% |

---

## 3. 🔄 Recurring Expenses

### What are Recurring Expenses?
Subscriptions and regular payments like:
- Adobe Creative Cloud (monthly)
- Internet provider (monthly)
- Insurance (monthly/yearly)
- Hosting services (monthly/yearly)

### Where to See Them

#### Dashboard Widget
Look for: **"Verwachte kosten volgende maand: €X"**

This shows you:
- Total expected recurring costs next month
- Number of recurring subscriptions
- Helps you plan your cash flow

### Examples in Mock Data
- Adobe Creative Cloud: €72.59/month
- Ziggo Internet: €54.45/month
- Aansprakelijkheidsverzekering: €42.35/month

**Total forecast**: ~€169/month

### Future Enhancement
Soon you'll be able to:
- Mark new expenses as recurring when adding them
- Set end dates for subscriptions
- Auto-generate future expenses

---

## 4. ⏰ BTW Deadline Alerts

### What You See
A prominent card on your dashboard showing:
- **Days remaining** until next BTW filing deadline
- **Quarter** the deadline is for
- **Exact date** (e.g., "31 januari 2026")
- **Color-coded urgency**

### Deadline Dates
- **Q1** (Jan-Mar) → Deadline: **30 april**
- **Q2** (Apr-Jun) → Deadline: **31 juli**
- **Q3** (Jul-Sep) → Deadline: **31 oktober**
- **Q4** (Oct-Dec) → Deadline: **31 januari** (next year)

### Color Coding
- 🟢 **Green** (> 30 days): "Voldoende tijd tot de deadline"
- 🟠 **Orange** (7-30 days): "Let op: deadline nadert"
- 🔴 **Red** (< 7 days): "⚠️ Deadline is zeer dichtbij!"

### Example
```
BTW Aangifte Deadline
45 dagen
Q4 2025
31 januari 2026
[Green indicator]
Voldoende tijd tot de deadline
```

---

## 5. 📥 CSV Export

### Why Export?
- Import into accounting software (Exact, Moneybird)
- Share with your accountant
- Keep offline backups
- Analyze in Excel/Google Sheets

### How to Export

#### From Expenses Page
1. Go to **"Uitgaven"** in sidebar
2. Select **year** and **quarter** you want
3. Click **"Exporteer CSV"** button (new!)
4. File downloads automatically

#### File Format
```csv
Datum,Omschrijving,Categorie,Bedrag excl. BTW,BTW %,BTW Bedrag,Bedrag incl. BTW,Kwartaal,Jaar,Herhaald,Bron
2026-02-15,"Kantoorbenodigdheden",Kantoor,450.00,21,94.50,544.50,1,2026,Nee,Handmatig
2026-03-01,"Adobe Creative Cloud",Software,59.99,21,12.60,72.59,1,2026,Ja,Handmatig
```

#### Filename Format
`uitgaven_YYYY_QX_2026-02-14.csv`

Examples:
- `uitgaven_2026_Q1_2026-02-14.csv` (Q1 2026)
- `uitgaven_2026_2026-02-14.csv` (Full year 2026)

### CSV Columns Explained
- **Datum**: Expense date
- **Omschrijving**: Description
- **Categorie**: Category (Kantoor, Software, etc.)
- **Bedrag excl. BTW**: Amount excluding VAT
- **BTW %**: VAT percentage (0, 9, or 21)
- **BTW Bedrag**: VAT amount
- **Bedrag incl. BTW**: Total amount including VAT
- **Kwartaal**: Quarter (1-4)
- **Jaar**: Year
- **Herhaald**: Is recurring (Ja/Nee)
- **Bron**: Source (Handmatig/Bank import/Herhaald)

---

## 🎨 UI Improvements

### New Navigation Item
The sidebar now has:
```
📊 Dashboard
💳 Uitgaven
📤 Importeren     ← NEW!
🏷️ Categorieën
📄 Rapporten
⚙️ Instellingen
```

### Dashboard Enhancements
The dashboard now shows (top to bottom):
1. KOR eligibility banner (if applicable)
2. BTW deadline alert + Recurring forecast
3. Key metrics (Uitgaven, BTW, Boekingen)
4. BTW gauge + Category pie chart
5. Monthly trend line chart
6. Quarter summary

---

## 💡 Pro Tips

### Bank Import
- **Review before confirming**: Always check categories
- **One month at a time**: Easier to review
- **Filter first**: Most banks let you filter by debit only
- **Save file**: Keep original CSV for records

### Recurring Expenses
- **Check monthly**: Review your recurring widget regularly
- **Plan ahead**: Use forecast for cash flow planning
- **Cancel unused**: Easy to spot subscriptions you don't need

### Deadlines
- **Set reminder**: Even with the widget, set calendar reminder
- **Buffer time**: Try to file 1 week before deadline
- **Red = urgent**: If widget is red, drop everything and file

### CSV Export
- **Export quarterly**: Do it after filing BTW
- **Backup regularly**: Download end of each quarter
- **Share with accountant**: Direct link to download

---

## 🚀 Getting Started Checklist

- [ ] Check KOR eligibility on dashboard
- [ ] Enable/disable KOR in settings if applicable
- [ ] Note BTW deadline countdown
- [ ] Try importing a bank statement
- [ ] Review recurring expenses forecast
- [ ] Export your current quarter to CSV
- [ ] Share with your accountant (optional)

---

## ❓ FAQ

### Q: Is bank import safe?
**A**: Yes! Files are processed server-side and immediately converted. We don't store raw bank files.

### Q: What if my bank isn't supported?
**A**: Try anyway! The generic parser can handle most CSV formats. Just review carefully before confirming.

### Q: Can I edit imported transactions?
**A**: Yes, after import they're regular expenses. Edit or delete like any other expense.

### Q: Is the KOR recommendation accurate?
**A**: It's an estimate based on expenses. Revenue data would be more accurate. Always consult a tax advisor.

### Q: Can I export all years at once?
**A**: Currently by quarter only. Leave year/quarter filters empty to export all.

### Q: What if I miss a deadline?
**A**: File ASAP! The Belastingdienst charges late fees. The widget is a helper, not a replacement for your calendar.

---

## 🆘 Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Try refreshing the page
3. Clear browser cache if import fails
4. Contact support with:
   - Feature name
   - What you tried
   - Error message (if any)
   - Browser and device

---

## 🎉 Enjoy Your New Features!

These features are designed to save you time and make tax administration easier. Start with bank import to quickly add expenses, check your KOR eligibility, and never miss a deadline with the new alerts.

**Happy administrating!** 🚀
