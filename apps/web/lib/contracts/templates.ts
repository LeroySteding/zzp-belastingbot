export interface ContractTemplate {
  name: string;
  description: string;
  content: string;
}

export const CONTRACT_TEMPLATES: Record<string, ContractTemplate> = {
  freelance: {
    name: 'Freelance Overeenkomst',
    description: 'Standaard freelance/ZZP overeenkomst',
    content: `# Overeenkomst van Opdracht

Tussen:
**{companyName}** ({kvk}), hierna "Opdrachtnemer"
en
**{clientName}**, hierna "Opdrachtgever"

## Artikel 1 - Opdracht
Opdrachtnemer zal de volgende werkzaamheden verrichten:
{description}

## Artikel 2 - Duur
Deze overeenkomst gaat in op {startDate} en eindigt op {endDate}.

## Artikel 3 - Vergoeding
- Uurtarief: \u20AC{hourlyRate} excl. BTW
- Facturatie: maandelijks achteraf
- Betalingstermijn: {paymentTerms}

## Artikel 4 - Intellectueel Eigendom
Alle resultaten van de werkzaamheden worden eigendom van Opdrachtgever na volledige betaling van de vergoeding. Opdrachtnemer behoudt het recht om de werkzaamheden te gebruiken voor promotiedoeleinden, tenzij schriftelijk anders overeengekomen.

## Artikel 5 - Geheimhouding
Beide partijen verplichten zich tot geheimhouding van alle vertrouwelijke informatie die zij in het kader van deze overeenkomst van elkaar ontvangen. Deze verplichting geldt ook na beeindiging van de overeenkomst.

## Artikel 6 - Aansprakelijkheid
De aansprakelijkheid van Opdrachtnemer is beperkt tot het bedrag dat in het kader van deze overeenkomst is gefactureerd over de afgelopen 3 maanden. Opdrachtnemer is niet aansprakelijk voor indirecte schade.

## Artikel 7 - Beeindiging
Deze overeenkomst kan door beide partijen worden opgezegd met inachtneming van een opzegtermijn van 1 maand. Opzegging dient schriftelijk te geschieden.

## Artikel 8 - Toepasselijk recht
Op deze overeenkomst is Nederlands recht van toepassing.

Getekend te __________ op {date}

Opdrachtnemer: ________________

Opdrachtgever: ________________`,
  },
  project: {
    name: 'Projectovereenkomst',
    description: 'Vaste prijs project overeenkomst',
    content: `# Projectovereenkomst

Tussen:
**{companyName}** ({kvk}), hierna "Opdrachtnemer"
en
**{clientName}**, hierna "Opdrachtgever"

## Artikel 1 - Projectomschrijving
{description}

## Artikel 2 - Looptijd
Dit project start op {startDate} en wordt opgeleverd uiterlijk op {endDate}.

## Artikel 3 - Vergoeding
- Projectprijs: \u20AC{fixedPrice} excl. BTW
- Betaling in termijnen:
  - 30% bij ondertekening: \u20AC{deposit} excl. BTW
  - 40% bij tussentijdse oplevering
  - 30% bij eindoplevering
- Betalingstermijn: {paymentTerms}

## Artikel 4 - Scope en wijzigingen
Wijzigingen in de scope van het project worden schriftelijk vastgelegd in een aanvullende overeenkomst. Meerwerk wordt gefactureerd tegen een uurtarief van \u20AC{hourlyRate} excl. BTW.

## Artikel 5 - Oplevering en acceptatie
Na oplevering heeft Opdrachtgever 14 dagen om het resultaat te beoordelen. Eventuele gebreken worden door Opdrachtnemer kosteloos hersteld, mits deze binnen de oorspronkelijke scope vallen.

## Artikel 6 - Intellectueel Eigendom
Na volledige betaling worden alle rechten op het projectresultaat overgedragen aan Opdrachtgever.

## Artikel 7 - Geheimhouding
Beide partijen verplichten zich tot geheimhouding van alle vertrouwelijke informatie.

## Artikel 8 - Aansprakelijkheid
De aansprakelijkheid van Opdrachtnemer is beperkt tot de totale projectprijs.

## Artikel 9 - Toepasselijk recht
Op deze overeenkomst is Nederlands recht van toepassing.

Getekend te __________ op {date}

Opdrachtnemer: ________________

Opdrachtgever: ________________`,
  },
  nda: {
    name: 'Geheimhoudingsverklaring (NDA)',
    description: 'Non-disclosure agreement',
    content: `# Geheimhoudingsverklaring

Tussen:
**{companyName}** ({kvk}), hierna "Partij A"
en
**{clientName}**, hierna "Partij B"

gezamenlijk te noemen "Partijen"

## Artikel 1 - Definities
Onder "Vertrouwelijke Informatie" wordt verstaan: alle informatie die door een Partij aan de andere Partij wordt verstrekt, zowel mondeling als schriftelijk, die als vertrouwelijk is aangemerkt of waarvan de ontvangende Partij redelijkerwijs had moeten begrijpen dat deze vertrouwelijk is.

## Artikel 2 - Geheimhouding
Partijen verplichten zich om Vertrouwelijke Informatie:
- Geheim te houden en niet aan derden te openbaren
- Uitsluitend te gebruiken voor het doel waarvoor deze is verstrekt
- Niet te kopieren of te vermenigvuldigen zonder schriftelijke toestemming

## Artikel 3 - Uitzonderingen
De geheimhoudingsplicht geldt niet voor informatie die:
- Reeds openbaar was op het moment van verstrekking
- Naderhand openbaar is geworden zonder toedoen van de ontvangende Partij
- Reeds in bezit was van de ontvangende Partij
- Van een derde is verkregen die gerechtigd was deze te verstrekken

## Artikel 4 - Duur
Deze geheimhoudingsverklaring is geldig van {startDate} tot {endDate}. De geheimhoudingsplicht blijft van kracht tot 2 jaar na beeindiging van deze overeenkomst.

## Artikel 5 - Boetebeding
Bij overtreding van deze overeenkomst verbeurt de overtredende Partij een direct opeisbare boete van \u20AC10.000,- per overtreding, onverminderd het recht op volledige schadevergoeding.

## Artikel 6 - Toepasselijk recht
Op deze overeenkomst is Nederlands recht van toepassing.

Getekend te __________ op {date}

Partij A: ________________

Partij B: ________________`,
  },
  maintenance: {
    name: 'Onderhoudscontract',
    description: 'Doorlopend onderhouds-/retainer contract',
    content: `# Onderhoudsovereenkomst

Tussen:
**{companyName}** ({kvk}), hierna "Opdrachtnemer"
en
**{clientName}**, hierna "Opdrachtgever"

## Artikel 1 - Dienstverlening
Opdrachtnemer zal de volgende onderhoudsdiensten verrichten:
{description}

## Artikel 2 - Looptijd
Deze overeenkomst gaat in op {startDate} en wordt aangegaan voor onbepaalde tijd, met een minimale looptijd tot {endDate}.

## Artikel 3 - Vergoeding
- Maandelijks retainer: \u20AC{fixedPrice} excl. BTW
- Inclusief: {hoursIncluded} uur per maand
- Meerwerk: \u20AC{hourlyRate} excl. BTW per uur
- Betalingstermijn: {paymentTerms}

## Artikel 4 - Service Level
- Reactietijd bij storingen: binnen 4 werkuren
- Oplostijd bij kritieke storingen: binnen 8 werkuren
- Beschikbaarheid: werkdagen 09:00 - 17:00

## Artikel 5 - Rapportage
Opdrachtnemer zal maandelijks een overzicht verstrekken van de uitgevoerde werkzaamheden en bestede uren.

## Artikel 6 - Beeindiging
Na de minimale looptijd kan deze overeenkomst door beide partijen worden opgezegd met inachtneming van een opzegtermijn van 2 maanden. Opzegging dient schriftelijk te geschieden.

## Artikel 7 - Geheimhouding
Beide partijen verplichten zich tot geheimhouding van alle vertrouwelijke informatie.

## Artikel 8 - Toepasselijk recht
Op deze overeenkomst is Nederlands recht van toepassing.

Getekend te __________ op {date}

Opdrachtnemer: ________________

Opdrachtgever: ________________`,
  },
};

export function fillTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`);
  }
  return result;
}
