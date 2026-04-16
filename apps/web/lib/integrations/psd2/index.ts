/**
 * PSD2 Integration Framework - Main Entry Point
 *
 * This module re-exports all PSD2 types, clients, and utilities
 * and provides a factory function to instantiate the correct client
 * for a given bank.
 */

export * from './types'
export * from './encryption'
export { PSD2Client } from './client'
export { RabobankClient, createRabobankClient } from './rabobank'
export { RevolutClient, createRevolutClient } from './revolut'

import type { PSD2Bank } from './types'
import { PSD2Client } from './client'
import { createRabobankClient } from './rabobank'
import { createRevolutClient } from './revolut'

/**
 * Factory: create the appropriate PSD2 client for a bank.
 *
 * @throws Error if the bank is not yet supported
 */
export function createPSD2Client(bank: PSD2Bank): PSD2Client {
  switch (bank) {
    case 'rabobank':
      return createRabobankClient()
    case 'revolut':
      return createRevolutClient()
    case 'bunq':
      // TODO: Implement bunq PSD2 client
      // bunq uses a custom API (not Berlin Group) at https://api.bunq.com
      // Docs: https://doc.bunq.com/
      // Requires: bunq API key + OAuth2 app registration
      throw new Error('bunq PSD2 integratie is nog niet beschikbaar')
    case 'knab':
      // TODO: Implement Knab PSD2 client
      // Knab follows the Berlin Group NextGenPSD2 standard
      // Developer portal: Check Knab website for API access
      // Requires: AISP license + eIDAS certificates
      throw new Error('Knab PSD2 integratie is nog niet beschikbaar')
    default:
      throw new Error(`Onbekende bank: ${bank}`)
  }
}

/**
 * Supported banks with their display info (for use in UI).
 */
export const PSD2_BANKS: Array<{
  bank: PSD2Bank
  displayName: string
  available: boolean
  description: string
}> = [
  {
    bank: 'rabobank',
    displayName: 'Rabobank',
    available: true,
    description: 'Automatisch transacties ophalen via PSD2 Open Banking API',
  },
  {
    bank: 'revolut',
    displayName: 'Revolut Business',
    available: true,
    description: 'Automatisch transacties synchroniseren vanuit Revolut Business',
  },
  {
    bank: 'bunq',
    displayName: 'bunq',
    available: false,
    description: 'bunq API-koppeling (binnenkort beschikbaar)',
  },
  {
    bank: 'knab',
    displayName: 'Knab',
    available: false,
    description: 'Knab PSD2 API-koppeling (binnenkort beschikbaar)',
  },
]
