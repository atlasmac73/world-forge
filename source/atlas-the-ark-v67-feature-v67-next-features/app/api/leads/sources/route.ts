/**
 * THE ARK — Free Lead Sources API
 * Route: GET /api/leads/sources?market=wv|co|both
 * Returns curated free public data sources for motivated seller leads.
 * WV: within 90 min of 25177 (Saint Albans / Nitro / Charleston)
 * CO: within 90 min of 80222 (Denver metro / Broomfield / Aurora)
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const WV_SOURCES = [
  {
    id: 'kanawha-sheriff-tax',
    name: 'Kanawha County Sheriff — Tax Sales',
    url: 'https://www.kanawhasheriff.us/civil-process/tax-sales',
    type: 'free' as const,
    data_types: ['tax-delinquent', 'owner-name', 'property-address', 'amount-owed'],
    update_frequency: 'annually (before sheriff sale)',
    notes: 'Published before annual sheriff sale. Best free WV motivated seller source. Download PDF, extract addresses.',
    coverage: 'wv',
    priority_zips: ['25177', '25143', '25301', '25302', '25303'],
  },
  {
    id: 'kanawha-assessor',
    name: 'Kanawha County Assessor — Property Search',
    url: 'https://www.kanawhaassessor.com/',
    type: 'free' as const,
    data_types: ['owner-name', 'mailing-address', 'assessed-value', 'property-details'],
    update_frequency: 'annually',
    notes: 'Free owner lookup. Mailing address ≠ property address = absentee owner. Search by address, name, or parcel ID.',
    coverage: 'wv',
    priority_zips: ['25177', '25143', '25301', '25302'],
  },
  {
    id: 'putnam-assessor',
    name: 'Putnam County Assessor',
    url: 'https://www.putnamassessor.com/',
    type: 'free' as const,
    data_types: ['owner-name', 'mailing-address', 'assessed-value'],
    update_frequency: 'annually',
    notes: 'Covers Hurricane (25526), Teays Valley, Winfield (25571). Saint Albans straddles Kanawha/Putnam.',
    coverage: 'wv',
    priority_zips: ['25526', '25571', '25168'],
  },
  {
    id: 'cabell-assessor',
    name: 'Cabell County Assessor',
    url: 'https://www.cabellassessor.com/',
    type: 'free' as const,
    data_types: ['owner-name', 'mailing-address', 'assessed-value'],
    update_frequency: 'annually',
    notes: 'Covers Huntington (25701-25705). 45 min from Saint Albans. Strong D4D territory.',
    coverage: 'wv',
    priority_zips: ['25701', '25702', '25703', '25704', '25705'],
  },
  {
    id: 'wv-judiciary-probate',
    name: 'WV Judiciary — Kanawha Circuit Court (Probate)',
    url: 'https://www.courtswv.gov/public-resources/court-information-by-county/kanawha',
    type: 'free' as const,
    data_types: ['probate-filings', 'estate-names', 'property-involved', 'hearing-dates'],
    update_frequency: 'weekly',
    notes: 'Probate = heirs who need to sell. Free public records. Check weekly. Cross-reference with assessor for property address.',
    coverage: 'wv',
    priority_zips: ['25177', '25301', '25302'],
  },
  {
    id: 'wv-gazette-foreclosures',
    name: 'WV Gazette-Mail — Legal Ads (Foreclosures)',
    url: 'https://www.wvgazettemail.com/legal_advertisements/',
    type: 'free' as const,
    data_types: ['foreclosure-address', 'auction-date', 'property-description', 'lender'],
    update_frequency: 'weekly',
    notes: 'WV law requires foreclosure publication. Free to read. 30-60 days lead time before auction date.',
    coverage: 'wv',
    priority_zips: ['25177', '25143', '25301'],
  },
  {
    id: 'wv-sos-liens',
    name: 'WV Secretary of State — Lien Search',
    url: 'https://apps.wv.gov/sos/propertySearch/',
    type: 'free' as const,
    data_types: ['liens', 'owner-name', 'lien-amount'],
    update_frequency: 'real-time',
    notes: 'Tax liens, HOA liens, judgment liens. Cross-reference with assessor for full picture.',
    coverage: 'wv',
    priority_zips: ['25177', '25301', '25302', '25143'],
  },
  {
    id: 'charleston-code-enforcement',
    name: 'Charleston Code Enforcement (FOIA)',
    url: 'https://www.charlestonwv.gov/services/housing/',
    type: 'free' as const,
    data_types: ['code-violations', 'property-address', 'violation-type', 'owner-name'],
    update_frequency: 'monthly via FOIA request',
    notes: 'FOIA request for violation list — free within 5 business days. 3+ violations = high motivation.',
    coverage: 'wv',
    priority_zips: ['25301', '25302', '25303', '25304'],
  },
  {
    id: 'craigslist-charleston',
    name: 'Craigslist Charleston WV — FSBO',
    url: 'https://charlestonwv.craigslist.org/search/hhh?sale_date=all_dates&sort=date',
    type: 'free' as const,
    data_types: ['fsbo-listings', 'price', 'description', 'seller-contact'],
    update_frequency: 'daily',
    notes: 'Watch for: "must sell", "estate sale", "as-is", "cash only". Sellers bypass agents = flexible terms.',
    coverage: 'wv',
    priority_zips: ['25177', '25143', '25301'],
  },
  {
    id: 'propwire-wv',
    name: 'PropWire — WV Free Tier (100 leads/mo)',
    url: 'https://propwire.com/',
    type: 'freemium' as const,
    data_types: ['pre-foreclosure', 'tax-delinquent', 'absentee-owners'],
    update_frequency: 'daily',
    notes: 'Free tier: 100 leads/month. Best free PropStream alternative. Kanawha/Putnam/Cabell coverage.',
    coverage: 'wv',
    priority_zips: ['25177', '25301', '25143'],
  },
]

const CO_SOURCES = [
  {
    id: 'denver-public-trustee',
    name: 'Denver Public Trustee — Foreclosure Sales',
    url: 'https://www.denvertreasurer.gov/public-trustee/foreclosures',
    type: 'free' as const,
    data_types: ['foreclosure-address', 'sale-date', 'outstanding-balance'],
    update_frequency: 'weekly',
    notes: 'CO non-judicial foreclosure. 110-125 day timeline from Notice to sale. 80222 area active. Free public list.',
    coverage: 'co',
    priority_zips: ['80222', '80219', '80223', '80204'],
  },
  {
    id: 'arapahoe-public-trustee',
    name: 'Arapahoe County Public Trustee',
    url: 'https://www.co.arapahoe.co.us/1071/Public-Trustee',
    type: 'free' as const,
    data_types: ['foreclosure-address', 'sale-date', 'outstanding-balance'],
    update_frequency: 'weekly',
    notes: 'Aurora (80010-80019), Centennial (80111, 80122). Free weekly foreclosure list.',
    coverage: 'co',
    priority_zips: ['80010', '80011', '80012', '80014', '80111'],
  },
  {
    id: 'jefferson-public-trustee',
    name: 'Jefferson County Public Trustee',
    url: 'https://www.jeffco.us/820/Public-Trustee',
    type: 'free' as const,
    data_types: ['foreclosure-address', 'sale-date', 'outstanding-balance'],
    update_frequency: 'weekly',
    notes: 'Lakewood (80226-80228), Golden (80401), Arvada. Free weekly list. Good mix of price points.',
    coverage: 'co',
    priority_zips: ['80226', '80227', '80228', '80401'],
  },
  {
    id: 'denver-assessor',
    name: 'Denver County Assessor — Property Search',
    url: 'https://www.denvergov.org/assessors',
    type: 'free' as const,
    data_types: ['owner-name', 'mailing-address', 'assessed-value', 'tax-status'],
    update_frequency: 'annually',
    notes: 'Free owner lookup. Mailing vs property address = absentee detection. 80222 has high absentee landlord rate.',
    coverage: 'co',
    priority_zips: ['80222', '80219', '80223'],
  },
  {
    id: 'broomfield-assessor',
    name: 'Broomfield County Assessor',
    url: 'https://www.broomfield.org/1718/Assessor',
    type: 'free' as const,
    data_types: ['owner-name', 'mailing-address', 'assessed-value'],
    update_frequency: 'annually',
    notes: 'Covers Broomfield (80021, 80020). Adrian Burdette (Burdette Built LLC) territory. Commercial + residential.',
    coverage: 'co',
    priority_zips: ['80021', '80020'],
  },
  {
    id: 'redfin-price-drops-co',
    name: 'Redfin — Denver Price Reduced Listings',
    url: 'https://www.redfin.com/city/7226/CO/Denver/filter/price-reduced=true',
    type: 'free' as const,
    data_types: ['price-reductions', 'days-on-market', 'listing-history'],
    update_frequency: 'daily',
    notes: 'Price reduced + 60+ DOM = motivated seller. Multiple drops = negotiable. Contact listing agent directly.',
    coverage: 'co',
    priority_zips: ['80222', '80219', '80204', '80205'],
  },
  {
    id: 'craigslist-denver',
    name: 'Craigslist Denver — FSBO',
    url: 'https://denver.craigslist.org/search/hhh?sale_date=all_dates&sort=date',
    type: 'free' as const,
    data_types: ['fsbo-listings', 'price', 'description', 'seller-contact'],
    update_frequency: 'daily',
    notes: 'Estate sales, job relocation, divorce common. 80219/80222 area regularly listed. Watch for motivated keywords.',
    coverage: 'co',
    priority_zips: ['80222', '80219', '80223'],
  },
  {
    id: 'douglas-public-trustee',
    name: 'Douglas County Public Trustee',
    url: 'https://www.douglas.co.us/public-trustee/',
    type: 'free' as const,
    data_types: ['foreclosure-address', 'sale-date'],
    update_frequency: 'weekly',
    notes: 'Parker (80134), Castle Rock (80104), Lone Tree (80124). Higher price points — good wholesale spreads.',
    coverage: 'co',
    priority_zips: ['80112', '80120', '80134'],
  },
]

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const market = req.nextUrl.searchParams.get('market') ?? 'both'

  const sources = market === 'wv'
    ? WV_SOURCES
    : market === 'co'
      ? CO_SOURCES
      : [...WV_SOURCES, ...CO_SOURCES]

  return NextResponse.json({
    data: sources,
    meta: {
      total: sources.length,
      free: sources.filter(s => s.type === 'free').length,
      freemium: sources.filter(s => s.type === 'freemium').length,
      wv_anchor_zip: '25177',
      co_anchor_zip: '80222',
      wv_priority_zips: ['25177', '25143', '25301', '25302', '25303', '25526', '25701'],
      co_priority_zips: ['80222', '80219', '80223', '80010', '80226', '80021'],
      coverage_note: 'WV: all within 90 min of 25177 Saint Albans. CO: all within 90 min of 80222 Denver.',
    }
  })
}
