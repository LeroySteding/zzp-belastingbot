'use server';

export interface AddressResult {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  municipality?: string;
  province?: string;
}

export async function lookupAddress(
  postalCode: string,
  houseNumber: string
): Promise<{ success: boolean; data?: AddressResult; error?: string }> {
  // Clean postal code: "1234 AB" -> "1234AB"
  const cleanPostal = postalCode.replace(/\s/g, '').toUpperCase();
  const cleanNumber = houseNumber.trim();

  // Validate format: 4 digits + 2 letters
  if (!/^\d{4}[A-Z]{2}$/.test(cleanPostal)) {
    return { success: false, error: 'Ongeldige postcode (formaat: 1234AB)' };
  }

  if (!cleanNumber) {
    return { success: false, error: 'Huisnummer is verplicht' };
  }

  try {
    // Use PDOK Locatieserver (Dutch government, free, no auth)
    const query = encodeURIComponent(`${cleanPostal} ${cleanNumber}`);
    const response = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${query}&fq=type:adres&rows=1`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      return { success: false, error: 'Fout bij opvragen adres' };
    }

    const data = await response.json();
    const doc = data.response?.docs?.[0];

    if (!doc) {
      return { success: false, error: 'Adres niet gevonden' };
    }

    return {
      success: true,
      data: {
        street: doc.straatnaam || '',
        houseNumber: doc.huis_nro?.toString() || cleanNumber,
        postalCode: doc.postcode || cleanPostal,
        city: doc.woonplaatsnaam || '',
        municipality: doc.gemeentenaam || '',
        province: doc.provincienaam || '',
      },
    };
  } catch {
    return { success: false, error: 'Fout bij verbinden met adresservice' };
  }
}
