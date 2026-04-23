/**
 * Bank Aggregator - Hoofd Entry Point
 *
 * Dit module biedt een uniforme interface voor het verbinden met
 * bankrekeningen via verschillende PSD2 aggregator providers.
 *
 * Ondersteunde providers:
 * - IBANXS: Nederlandse PSD2 provider met DNB-licentie
 * - Enable Banking: Europese PSD2 aggregator (opvolger Nordigen)
 * - Yapily: Open banking platform met gratis startplan
 *
 * Gebruik:
 *   const client = createBankAggregator({
 *     provider: 'ibanxs',
 *     apiKey: '...',
 *     sandboxMode: true,
 *   });
 *   const banks = await client.getAvailableBanks();
 */

import type {
  AggregatorProvider,
  BankAggregatorClient,
  BankAggregatorConfig,
} from './types';
import { IbanxsClient } from './providers/ibanxs';
import { EnableBankingClient } from './providers/enable-banking';
import { YapilyClient } from './providers/yapily';

// Re-export types
export * from './types';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Maak een bank aggregator client aan voor de opgegeven provider.
 *
 * @param config - Configuratie met provider, API keys en sandbox modus
 * @returns Een BankAggregatorClient instantie
 * @throws Error als de provider niet wordt ondersteund
 */
export function createBankAggregator(
  config: BankAggregatorConfig
): BankAggregatorClient {
  switch (config.provider) {
    case 'ibanxs':
      if (!config.apiKey) {
        throw new Error('IBANXS vereist een API key');
      }
      return new IbanxsClient(config.apiKey, config.sandboxMode);

    case 'enable_banking':
      if (!config.apiKey) {
        throw new Error('Enable Banking vereist een API key');
      }
      return new EnableBankingClient(config.apiKey, config.sandboxMode);

    case 'yapily':
      if (!config.apiKey || !config.apiSecret) {
        throw new Error('Yapily vereist een API key en API secret');
      }
      return new YapilyClient(
        config.apiKey,
        config.apiSecret,
        config.sandboxMode
      );

    case 'direct_psd2':
      throw new Error(
        'Directe PSD2 integratie wordt beheerd via lib/integrations/psd2'
      );

    default:
      throw new Error(
        `Provider "${config.provider}" wordt niet ondersteund`
      );
  }
}

// ---------------------------------------------------------------------------
// Provider informatie
// ---------------------------------------------------------------------------

/** Beschikbare aggregator providers met beschrijvingen */
export const AGGREGATOR_PROVIDERS = [
  {
    id: 'ibanxs' as const,
    name: 'IBANXS',
    description: 'Nederlandse PSD2 provider met DNB-licentie',
    country: 'NL',
    available: true,
    requiresSecret: false,
    docsUrl: 'https://docs.ibanxs.nl/',
  },
  {
    id: 'enable_banking' as const,
    name: 'Enable Banking',
    description: 'Europese PSD2 aggregator, opvolger van Nordigen',
    country: 'EU',
    available: true,
    requiresSecret: false,
    docsUrl: 'https://enablebanking.com/docs/',
  },
  {
    id: 'yapily' as const,
    name: 'Yapily',
    description: 'Open banking platform met gratis startplan',
    country: 'EU',
    available: true,
    requiresSecret: true,
    docsUrl: 'https://docs.yapily.com/',
  },
] as const;
