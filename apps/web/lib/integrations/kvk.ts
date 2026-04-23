'use server';

export interface KvkCompanyInfo {
  kvkNumber: string;
  companyName: string;
  tradeName?: string;
  legalForm?: string;
  address?: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
  };
  sbiCodes?: Array<{ code: string; description: string }>;
  isActive: boolean;
}

export async function lookupKvkNumber(
  kvkNumber: string,
): Promise<{ success: boolean; data?: KvkCompanyInfo; error?: string }> {
  const apiKey = process.env.KVK_API_KEY;

  // Invoer opschonen: spaties, punten en streepjes verwijderen
  const cleaned = kvkNumber.replace(/[\s.-]/g, '');

  // KVK-nummers bestaan uit 8 cijfers
  if (!/^\d{8}$/.test(cleaned)) {
    return { success: false, error: 'KVK-nummer moet 8 cijfers zijn' };
  }

  // Zonder API key de testomgeving gebruiken
  const baseUrl = apiKey
    ? 'https://api.kvk.nl/api/v1'
    : 'https://api.kvk.nl/test/api/v1';

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (apiKey) {
      headers['apikey'] = apiKey;
    }

    const response = await fetch(`${baseUrl}/basisprofielen/${cleaned}`, {
      headers,
    });

    if (response.status === 404) {
      return { success: false, error: 'KVK-nummer niet gevonden' };
    }

    if (!response.ok) {
      return { success: false, error: 'Fout bij opvragen KVK gegevens' };
    }

    const data = await response.json();

    // KVK-response parsen (geneste objecten)
    const embedded =
      data._embedded?.hoofdvestiging || data._embedded?.eigenaar;
    const addresses = embedded?.adressen || [];
    const visitAddress =
      addresses.find((a: Record<string, unknown>) => a.type === 'bezoekadres') ||
      addresses[0];

    const result: KvkCompanyInfo = {
      kvkNumber: cleaned,
      companyName: data.naam || data.handelsnaam || '',
      tradeName: data.handelsnaam,
      legalForm: data.rechtsvorm,
      isActive: data.actief !== false,
    };

    if (visitAddress) {
      result.address = {
        street: visitAddress.straatnaam || '',
        houseNumber: visitAddress.huisnummer?.toString() || '',
        postalCode: visitAddress.postcode || '',
        city: visitAddress.plaats || '',
        country: visitAddress.land || 'Nederland',
      };
    }

    if (data.sbiActiviteiten) {
      result.sbiCodes = data.sbiActiviteiten.map(
        (s: Record<string, unknown>) => ({
          code: (s.sbiCode as string) || '',
          description: (s.sbiOmschrijving as string) || '',
        }),
      );
    }

    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Fout bij verbinden met KVK' };
  }
}
