# Week 3 Quick Start Guide

## 🎯 What's New in Week 3?

Week 3 adds complete **BTW reporting** functionality with professional PDF generation and category management.

## 🚀 Getting Started

### Prerequisites
- Week 1 & 2 already set up
- Expenses added to the system
- Profile configured with company details

### New Package Installed
```bash
npm install @react-pdf/renderer
```

## 📱 New Pages

### 1. BTW Reports (`/reports`)
The main reporting hub where you can:
- Generate quarterly BTW reports
- View all existing reports
- Download PDFs
- Track report status

### 2. Report Details (`/reports/[id]`)
Detailed view of a specific report:
- All BTW rubrieken
- Category breakdown
- Full expense list
- Status management
- PDF download

### 3. Categories (`/categories`)
Category management and analytics:
- Statistics per category
- Spending distribution
- Top categories
- Visual charts

## 🎮 How to Use

### Generate Your First BTW Report

1. **Navigate to Reports**
   ```
   Click "Rapporten" in sidebar → /reports
   ```

2. **Select Period**
   - Choose a **Year** (e.g., 2024)
   - Choose a **Quarter** (Q1, Q2, Q3, or Q4)

3. **Generate**
   - Click "Genereer rapport"
   - Wait for processing (a few seconds)
   - Preview modal appears

4. **Review Preview**
   - See summary statistics
   - Number of expenses found
   - Total amounts

5. **Download or View**
   - Click "Download PDF" for immediate download
   - Click "Volledig rapport bekijken" for detailed view

### View Report Details

1. **From Reports List**
   - Find your report in the list
   - Click "Bekijken" button

2. **Review Details**
   - **BTW Rubrieken**: See all Belastingdienst fields
   - **Category Breakdown**: Expenses grouped by category
   - **Expense List**: Every single expense with details

3. **Manage Status**
   - Change status: Concept → Ingediend → Betaald
   - Status dropdown at top of page

4. **Download PDF**
   - Click "Download PDF" button
   - Opens PDF in new tab
   - Filename: `BTW-Rapport-Q{quarter}-{year}.pdf`

### Analyze Categories

1. **Navigate to Categories**
   ```
   Click "Categorieën" in sidebar → /categories
   ```

2. **View Statistics**
   - **Overall Stats**: Total expenses, amounts, BTW
   - **Category Table**: Breakdown by category
   - **Top 3**: Highest spending categories

3. **Understand Metrics**
   - **Aantal**: Number of expenses
   - **Excl. BTW**: Amount excluding tax
   - **BTW**: Tax amount paid
   - **Incl. BTW**: Total including tax
   - **Gemiddeld**: Average per expense
   - **% van totaal**: Percentage of all spending

## 📄 PDF Report Structure

### Page 1: Summary
- **Header**
  - Report title
  - Period (Q{x} YYYY)
  - Company information

- **BTW Rubrieken**
  - Rubriek 1a: Hoog tarief (21%)
  - Rubriek 1b: Laag tarief (9%)
  - Rubriek 1e: Nul tarief (0%)
  - Rubriek 5b: Voorbelasting
  - Rubriek 5g: Totaal te betalen/ontvangen

- **Category Breakdown**
  - All categories with counts and totals

- **Disclaimer**
  - Important notes about the report

### Page 2: Details
- **Full Expense List**
  - Date, description, category
  - BTW rate, amounts
  - Sorted by date

## 🎨 UI Features

### Status Badges
- 🕐 **Concept** (gray): Draft report
- 📋 **Ingediend** (blue): Submitted to Belastingdienst
- ✅ **Betaald** (green): Payment completed

### Report Cards
Each report displays:
- Quarter and year
- Period description (e.g., "januari - maart 2024")
- Status badge
- Amount summaries
- Action buttons

### Category Icons
- 🏢 Kantoor
- ✈️ Reizen
- 💻 Software
- 📱 Telefoon/Internet
- 🛡️ Verzekeringen
- 📦 Overig

## 🔧 API Endpoints

### Reports
```
GET    /api/reports          # List all reports
POST   /api/reports          # Generate new report
GET    /api/reports/[id]     # Get report details
PATCH  /api/reports/[id]     # Update report status
DELETE /api/reports/[id]     # Delete report
GET    /api/reports/[id]/pdf # Download PDF
```

### Categories
```
GET    /api/categories       # Get category statistics
```

## 💡 Pro Tips

### 1. Regular Reporting
Generate reports quarterly to stay on top of your BTW obligations.

### 2. Check Before Submitting
Always review the detailed report page before submitting to Belastingdienst.

### 3. Status Tracking
Update report status to track your workflow:
- Generate → **Concept**
- Review → Keep as **Concept** or mark **Ingediend**
- Payment processed → **Betaald**

### 4. Category Consistency
Use consistent categories for better reporting and analysis.

### 5. Profile Completion
Fill in your company details in Settings for professional PDFs:
- Company name
- BTW number
- KvK number

## ⚠️ Important Notes

### Report Scope
This system tracks **expenses only** (voorbelasting). For complete BTW-aangifte:
- Add your **omzet** (revenue) separately
- Calculate **BTW over omzet** (output tax)
- Subtract voorbelasting (input tax from this report)

### Disclaimer
Reports generated are for your records and preparation. Always verify with your accountant or Belastingdienst before submitting.

### Data Requirements
To generate a report:
- At least 1 expense in the selected quarter
- Expenses must have proper BTW rates (0%, 9%, or 21%)

## 🆘 Troubleshooting

### "Geen uitgaven gevonden"
- Add expenses for the selected period first
- Check that expenses have correct dates
- Ensure quarter/year selection is correct

### PDF Not Generating
- Check browser console for errors
- Try refreshing the page
- Ensure all expenses have valid data

### Numbers Look Wrong
- Verify expense amounts are correct
- Check BTW rates are properly set
- Ensure no duplicate expenses

## 📊 Example Workflow

```
1. Throughout Q1 2024:
   → Add expenses as they occur
   → Upload receipts with OCR

2. End of Q1 (April):
   → Go to /reports
   → Select 2024, Q1
   → Click "Genereer rapport"

3. Review:
   → Open report details
   → Check all rubrieken
   → Verify expense list
   → Download PDF

4. Submit:
   → Use PDF for reference
   → File BTW-aangifte via Belastingdienst
   → Update status to "Ingediend"

5. After Payment:
   → Update status to "Betaald"
   → Archive PDF for records
```

## 🎓 Next Steps

Now that you have complete BTW reporting:
1. **Regular Maintenance**: Add expenses weekly
2. **Monthly Reviews**: Check category spending
3. **Quarterly Reports**: Generate BTW reports
4. **Annual Overview**: Compare quarters year-over-year

## 🌟 Benefits

✅ **Time Saving**: Generate reports in seconds vs. hours manually  
✅ **Accuracy**: Automatic calculations, no math errors  
✅ **Professional**: Clean PDFs for accountant/records  
✅ **Insights**: Category analytics for better business decisions  
✅ **Compliance**: Proper rubrieken matching Belastingdienst format  

---

**Questions or Issues?**  
Check the main README or file a GitHub issue.

**Happy Reporting! 🎉**
