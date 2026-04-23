import { buildEmailHtml } from './templates';

// ============================================
// 1. WELCOME EMAIL
// ============================================

export function buildWelcomeEmail(userName: string): { subject: string; html: string; text: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zzpplatform.nl';

  const subject = 'Welkom bij ZZP Platform!';

  const body = `
    <p style="margin:0 0 16px 0;">Beste ${escapeHtml(userName)},</p>
    <p style="margin:0 0 16px 0;">Welkom bij ZZP Platform! Je account is succesvol aangemaakt. We helpen je graag op weg met je administratie.</p>
    <p style="margin:0 0 8px 0;font-weight:600;">Je eerste stappen:</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
      <tr>
        <td style="padding:8px 0;font-size:16px;line-height:1.6;color:#374151;">1. Maak je eerste factuur aan</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:16px;line-height:1.6;color:#374151;">2. Registreer je gewerkte uren</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:16px;line-height:1.6;color:#374151;">3. Bekijk je BTW-overzicht</td>
      </tr>
    </table>
    <p style="margin:0;">Veel succes met je onderneming!</p>
  `;

  const html = buildEmailHtml({
    preheader: 'Je account is aangemaakt. Ga aan de slag met je administratie.',
    title: 'Welkom bij ZZP Platform!',
    body,
    ctaText: 'Ga naar je dashboard',
    ctaUrl: `${appUrl}/dashboard`,
    footer: 'Vragen? Reply op deze email.',
  });

  const text = `Beste ${userName},

Welkom bij ZZP Platform! Je account is succesvol aangemaakt. We helpen je graag op weg met je administratie.

Je eerste stappen:
1. Maak je eerste factuur aan
2. Registreer je gewerkte uren
3. Bekijk je BTW-overzicht

Ga naar je dashboard: ${appUrl}/dashboard

Veel succes met je onderneming!

Vragen? Reply op deze email.

Verzonden via ZZP Platform`;

  return { subject, html, text };
}

// ============================================
// 2. INVOICE EMAIL
// ============================================

export function buildInvoiceEmail(params: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  senderName?: string;
  paymentUrl?: string;
  customMessage?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Factuur ${params.invoiceNumber}${params.senderName ? ` van ${params.senderName}` : ''}`;

  let body = '';

  if (params.customMessage) {
    body += `<p style="margin:0 0 16px 0;">${escapeHtml(params.customMessage).replace(/\n/g, '<br/>')}</p>`;
  }

  body += `
    <p style="margin:0 0 16px 0;">Beste ${escapeHtml(params.clientName)},</p>
    <p style="margin:0 0 16px 0;">Hierbij ontvangt u factuur ${escapeHtml(params.invoiceNumber)}.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;">
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Factuurnummer</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.invoiceNumber)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Bedrag</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.amount)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;">Vervaldatum</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;">${escapeHtml(params.dueDate)}</td>
      </tr>
    </table>
    <p style="margin:0;">De factuur is als PDF bijgevoegd bij deze email.</p>
  `;

  const html = buildEmailHtml({
    preheader: `Factuur ${params.invoiceNumber} - ${params.amount}`,
    title: `Factuur ${params.invoiceNumber}`,
    body,
    ctaText: params.paymentUrl ? 'Nu betalen' : undefined,
    ctaUrl: params.paymentUrl,
  });

  let text = '';
  if (params.customMessage) {
    text += `${params.customMessage}\n\n`;
  }
  text += `Beste ${params.clientName},

Hierbij ontvangt u factuur ${params.invoiceNumber}.

Factuurnummer: ${params.invoiceNumber}
Bedrag: ${params.amount}
Vervaldatum: ${params.dueDate}

De factuur is als PDF bijgevoegd bij deze email.`;

  if (params.paymentUrl) {
    text += `\n\nBetaal online: ${params.paymentUrl}`;
  }

  text += '\n\nVerzonden via ZZP Platform';

  return { subject, html, text };
}

// ============================================
// 3. PAYMENT CONFIRMATION
// ============================================

export function buildPaymentConfirmationEmail(params: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  paidDate: string;
}): { subject: string; html: string; text: string } {
  const subject = `Betaling ontvangen - Factuur ${params.invoiceNumber}`;

  const body = `
    <p style="margin:0 0 16px 0;">Beste ${escapeHtml(params.clientName)},</p>
    <p style="margin:0 0 16px 0;">Bedankt voor uw betaling. We bevestigen hierbij de ontvangst van uw betaling.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;">
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Factuurnummer</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.invoiceNumber)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Bedrag</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.amount)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;">Betaald op</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;">${escapeHtml(params.paidDate)}</td>
      </tr>
    </table>
    <p style="margin:0;color:#059669;font-weight:600;">Deze factuur is volledig betaald.</p>
  `;

  const html = buildEmailHtml({
    preheader: `Betaling ontvangen voor factuur ${params.invoiceNumber}`,
    title: 'Betaling ontvangen',
    body,
  });

  const text = `Beste ${params.clientName},

Bedankt voor uw betaling. We bevestigen hierbij de ontvangst van uw betaling.

Factuurnummer: ${params.invoiceNumber}
Bedrag: ${params.amount}
Betaald op: ${params.paidDate}

Deze factuur is volledig betaald.

Verzonden via ZZP Platform`;

  return { subject, html, text };
}

// ============================================
// 4. REMINDER EMAIL
// ============================================

export function buildReminderEmail(params: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  daysOverdue: number;
  paymentUrl?: string;
  bankDetails?: { iban: string; name: string; reference: string };
}): { subject: string; html: string; text: string } {
  const subject = `Herinnering: Factuur ${params.invoiceNumber} is ${params.daysOverdue} dagen verlopen`;

  let bankBlock = '';
  let bankText = '';
  if (params.bankDetails) {
    bankBlock = `
      <p style="margin:16px 0 8px 0;font-weight:600;">Bankgegevens:</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr style="background-color:#f9fafb;">
          <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">IBAN</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.bankDetails.iban)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">T.n.v.</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.bankDetails.name)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#6b7280;">Kenmerk</td>
          <td style="padding:10px 16px;font-size:14px;color:#1a1a2e;">${escapeHtml(params.bankDetails.reference)}</td>
        </tr>
      </table>
    `;
    bankText = `\nBankgegevens:\nIBAN: ${params.bankDetails.iban}\nT.n.v.: ${params.bankDetails.name}\nKenmerk: ${params.bankDetails.reference}\n`;
  }

  const body = `
    <p style="margin:0 0 16px 0;">Beste ${escapeHtml(params.clientName)},</p>
    <p style="margin:0 0 16px 0;">Wij willen u er vriendelijk aan herinneren dat de betaling van onderstaande factuur nog niet door ons is ontvangen.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;">
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Factuurnummer</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.invoiceNumber)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Bedrag</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.amount)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Vervaldatum</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.dueDate)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;">Dagen verlopen</td>
        <td style="padding:12px 16px;font-size:14px;color:#dc2626;font-weight:600;">${params.daysOverdue}</td>
      </tr>
    </table>
    ${bankBlock}
    <p style="margin:0 0 8px 0;">Wij verzoeken u vriendelijk het openstaande bedrag zo spoedig mogelijk over te maken.</p>
    <p style="margin:0;font-size:14px;color:#6b7280;">Mocht u de betaling reeds hebben verricht, dan kunt u deze herinnering als niet verzonden beschouwen.</p>
  `;

  const html = buildEmailHtml({
    preheader: `Herinnering: Factuur ${params.invoiceNumber} is ${params.daysOverdue} dagen verlopen`,
    title: 'Betalingsherinnering',
    body,
    ctaText: params.paymentUrl ? 'Nu betalen' : undefined,
    ctaUrl: params.paymentUrl,
  });

  let text = `Beste ${params.clientName},

Wij willen u er vriendelijk aan herinneren dat de betaling van onderstaande factuur nog niet door ons is ontvangen.

Factuurnummer: ${params.invoiceNumber}
Bedrag: ${params.amount}
Vervaldatum: ${params.dueDate}
Dagen verlopen: ${params.daysOverdue}
${bankText}
Wij verzoeken u vriendelijk het openstaande bedrag zo spoedig mogelijk over te maken.

Mocht u de betaling reeds hebben verricht, dan kunt u deze herinnering als niet verzonden beschouwen.`;

  if (params.paymentUrl) {
    text += `\n\nBetaal online: ${params.paymentUrl}`;
  }

  text += '\n\nVerzonden via ZZP Platform';

  return { subject, html, text };
}

// ============================================
// 5. PORTAL INVITATION
// ============================================

export function buildPortalInviteEmail(params: {
  clientName: string;
  senderName: string;
  portalUrl: string;
  projectName?: string;
}): { subject: string; html: string; text: string } {
  const subject = `${params.senderName} heeft je uitgenodigd voor het klantportaal`;

  const projectLine = params.projectName
    ? `<p style="margin:0 0 16px 0;">Project: <strong>${escapeHtml(params.projectName)}</strong></p>`
    : '';

  const body = `
    <p style="margin:0 0 16px 0;">Beste ${escapeHtml(params.clientName)},</p>
    <p style="margin:0 0 16px 0;">${escapeHtml(params.senderName)} heeft je uitgenodigd voor het klantportaal. Via het portaal kun je de voortgang van je project volgen, bestanden bekijken en facturen inzien.</p>
    ${projectLine}
    <p style="margin:0;">Klik op de knop hieronder om naar het portaal te gaan.</p>
  `;

  const html = buildEmailHtml({
    preheader: `${params.senderName} heeft je uitgenodigd voor het klantportaal`,
    title: 'Uitnodiging klantportaal',
    body,
    ctaText: 'Naar het portaal',
    ctaUrl: params.portalUrl,
  });

  let text = `Beste ${params.clientName},

${params.senderName} heeft je uitgenodigd voor het klantportaal. Via het portaal kun je de voortgang van je project volgen, bestanden bekijken en facturen inzien.`;

  if (params.projectName) {
    text += `\n\nProject: ${params.projectName}`;
  }

  text += `\n\nGa naar het portaal: ${params.portalUrl}`;
  text += '\n\nVerzonden via ZZP Platform';

  return { subject, html, text };
}

// ============================================
// 6. OFFERTE EMAIL
// ============================================

export function buildOfferteEmail(params: {
  clientName: string;
  offerteNumber: string;
  amount: string;
  validUntil: string;
  senderName?: string;
  customMessage?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Offerte ${params.offerteNumber}${params.senderName ? ` van ${params.senderName}` : ''}`;

  let body = '';

  if (params.customMessage) {
    body += `<p style="margin:0 0 16px 0;">${escapeHtml(params.customMessage).replace(/\n/g, '<br/>')}</p>`;
  }

  body += `
    <p style="margin:0 0 16px 0;">Beste ${escapeHtml(params.clientName)},</p>
    <p style="margin:0 0 16px 0;">Hierbij ontvangt u onze offerte. Wij hopen u hiermee een passend aanbod te doen.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#f9fafb;">
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Offertenummer</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.offerteNumber)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb;">Bedrag</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;border-bottom:1px solid #e5e7eb;">${escapeHtml(params.amount)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#6b7280;">Geldig tot</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a2e;">${escapeHtml(params.validUntil)}</td>
      </tr>
    </table>
    <p style="margin:0;">Bij vragen over deze offerte kunt u gerust contact met ons opnemen.</p>
  `;

  const html = buildEmailHtml({
    preheader: `Offerte ${params.offerteNumber} - ${params.amount}`,
    title: `Offerte ${params.offerteNumber}`,
    body,
  });

  let text = '';
  if (params.customMessage) {
    text += `${params.customMessage}\n\n`;
  }
  text += `Beste ${params.clientName},

Hierbij ontvangt u onze offerte. Wij hopen u hiermee een passend aanbod te doen.

Offertenummer: ${params.offerteNumber}
Bedrag: ${params.amount}
Geldig tot: ${params.validUntil}

Bij vragen over deze offerte kunt u gerust contact met ons opnemen.

Verzonden via ZZP Platform`;

  return { subject, html, text };
}

// ============================================
// HELPERS
// ============================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
