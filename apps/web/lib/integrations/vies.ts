'use server';

export interface ViesResult {
  valid: boolean;
  name: string | null;
  address: string | null;
  countryCode: string;
  vatNumber: string;
}

export async function validateVatNumber(fullVatNumber: string): Promise<ViesResult> {
  // Parse the input: "NL123456789B01" -> countryCode: "NL", vatNumber: "123456789B01"
  // Also handle "NL 123456789B01", "nl123456789b01", etc.
  const cleaned = fullVatNumber.replace(/[\s.-]/g, '').toUpperCase();

  if (cleaned.length < 4) {
    return { valid: false, name: null, address: null, countryCode: '', vatNumber: cleaned };
  }

  const countryCode = cleaned.substring(0, 2);
  const vatNumber = cleaned.substring(2);

  try {
    const response = await fetch('https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode, vatNumber }),
    });

    if (!response.ok) {
      return { valid: false, name: null, address: null, countryCode, vatNumber };
    }

    const data = await response.json();
    return {
      valid: data.valid === true,
      name: data.name || null,
      address: data.address || null,
      countryCode,
      vatNumber,
    };
  } catch {
    return { valid: false, name: null, address: null, countryCode, vatNumber };
  }
}
