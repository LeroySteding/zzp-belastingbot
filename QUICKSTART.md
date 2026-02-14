# 🚀 Quick Start Guide

Volg deze stappen om de ZZP Tax applicatie lokaal te draaien:

## 1. Dependencies installeren

```bash
npm install
```

## 2. Development server starten

```bash
npm run dev
```

De applicatie is nu beschikbaar op [http://localhost:3000](http://localhost:3000)

## 3. Inloggen

In **development mode** werkt de app met mock data. Je kunt inloggen met **elk willekeurig e-mailadres en wachtwoord**.

Voorbeelden:
- Email: `test@test.nl` + wachtwoord: `123456`
- Email: `demo@zzp.nl` + wachtwoord: `password`

## 4. De applicatie verkennen

### Dashboard
- Bekijk je kwartaal overzicht
- Totale uitgaven en BTW te betalen
- Aantal boekingen

### Uitgaven
- **Lijst**: Bekijk alle uitgaven gefilterd per jaar/kwartaal
- **Toevoegen**: Klik op "Nieuwe uitgave" om een uitgave toe te voegen
- **Bewerken**: Klik op het potlood icoon bij een uitgave
- **Verwijderen**: Klik op het prullenbak icoon

### Instellingen
- Vul je bedrijfsgegevens in
- BTW-nummer (formaat: NL123456789B01)
- KvK-nummer (8 cijfers)
- IBAN

### Rapporten
- Placeholder pagina voor toekomstige BTW-rapporten

## 5. Mock Data

De applicatie bevat voorbeelddata in `lib/mock-data.ts`:
- 5 voorbeelduitgaven
- Verspreid over het huidige kwartaal
- Verschillende categorieën en BTW-tarieven

## 6. Features testen

### ✅ Formulier validatie
Probeer een uitgave toe te voegen met:
- Leeg beschrijving veld → ziet validatiefout
- Negatief bedrag → ziet foutmelding
- Ongeldig BTW-nummer in instellingen → ziet validatie

### ✅ Responsive design
- Open de applicatie op je telefoon
- Gebruik de hamburger menu (☰) om de sidebar te openen
- Alle pagina's zijn mobile-friendly

### ✅ Berekeningen
- BTW wordt automatisch berekend (21%, 9%, of 0%)
- Kwartaal en jaar worden automatisch bepaald o.b.v. datum
- Dashboard toont correcte totalen

## 🔧 Build voor productie

```bash
npm run build
npm start
```

## 📝 Volgende stappen

1. **Supabase integratie**
   - Maak een Supabase account
   - Run de migratie uit `supabase/migrations/`
   - Voeg credentials toe aan `.env.local`

2. **Authentication activeren**
   - Verwijder de mock auth checks
   - Schakel echte Supabase Auth in

3. **Database connectie**
   - Vervang mock data calls met echte Supabase queries
   - Test CRUD operaties met echte data

## 🆘 Problemen?

### Port 3000 is al in gebruik
```bash
# Gebruik een andere port
PORT=3001 npm run dev
```

### Build errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### TypeScript errors
```bash
# Check types
npx tsc --noEmit
```

## 📚 Code structuur

- `app/` - Next.js App Router pagina's
- `components/` - Herbruikbare UI componenten
- `lib/` - Utilities, types, validatie, mock data
- `supabase/` - Database schema en migraties

**Veel succes! 🎉**
