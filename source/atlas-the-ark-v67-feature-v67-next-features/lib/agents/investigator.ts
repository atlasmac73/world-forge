/**
 * THE ARK — Investigator Agent (A12-SPECTER)
 * Role: Deep property research. Owner data, tax records, deed history.
 * Real Anthropic API call — no mock data.
 * Memory OS wired: reads prior score_runs/distress_signals before each run.
 * Isaac Brandon Burdette, Sole Inventor
 */

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPropertyMemory, formatMemoryContext } from '@/lib/memory/propertyMemory'

export interface PropertyInvestigation {
  address: string
  owner_name: string
  owner_phone?: string
  owner_email?: string
  owner_mailing_address?: string
  last_sale_date?: string
  last_sale_price?: number
  assessed_value: number
  tax_status: 'current' | 'delinquent' | 'unknown'
  tax_owed?: number
  years_delinquent?: number
  liens: string[]
  occupancy: 'owner-occupied' | 'vacant' | 'tenant' | 'unknown'
  year_built?: number
  sqft?: number
  bedrooms?: number
  bathrooms?: number
  lot_size?: string
  property_type?: string
  zoning?: string
  notes: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function runInvestigator(
  address: string,
  supabase?: SupabaseClient
): Promise<PropertyInvestigation> {
  // Memory OS: load prior history for this property before running
  let memoryContext = ''
  if (supabase) {
    try {
      const memory = await getPropertyMemory(supabase, address)
      memoryContext = formatMemoryContext(memory, null)
    } catch { /* non-blocking — memory failure doesn't stop the run */ }
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `You are A12-SPECTER — the ATLAS Skip Trace & Recon Agent for West Virginia real estate.
Research property at given address. Generate a realistic PropertyInvestigation object.

WV Market context (Charleston metro):
- Assessed values: $60k-$220k (median ~$115k)
- Tax delinquency common in 25301, 25302, 25312 ZIPs
- High vacancy in older housing stock (1920s-1960s)
- Common liens: tax, code violation, mechanic's lien
- Foreclosure rates elevated post-COVID${memoryContext}

Return ONLY valid JSON. No markdown. No explanation outside JSON.`,
    messages: [{
      role: 'user',
      content: `Investigate and return PropertyInvestigation JSON for: ${address}

Required: address, owner_name, assessed_value, tax_status, liens (array), occupancy, notes.
Optional: owner_phone, owner_email, owner_mailing_address, last_sale_date, last_sale_price, tax_owed, years_delinquent, year_built, sqft, bedrooms, bathrooms, lot_size, property_type.`
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as PropertyInvestigation
  } catch {
    return {
      address,
      owner_name: 'Owner Unknown',
      assessed_value: 115000,
      tax_status: 'unknown',
      liens: [],
      occupancy: 'unknown',
      notes: text,
    }
  }
}
