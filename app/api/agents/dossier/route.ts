/**
 * ATLAS v67 — Property Dossier API Route (Phase 5 Enhanced)
 * Pipeline: A12-SPECTER (Investigate) → A15-OMEN (Underwrite) → A06-HERALD (Copy)
 * Returns full PropertyDossier from a single address.
 * Real AI agents. No mock data.
 * Enhanced: saves agent_run_steps + agent_artifacts (Phase 3 tables)
 * Isaac Brandon Burdette · Atlas Genesis Matrix LLC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runInvestigator } from '@/lib/agents/investigator'
import { runUnderwriter } from '@/lib/agents/underwriter'
import { runCopywriter } from '@/lib/agents/copywriter'
import { checkKillSwitch, KILL_SWITCH_RESPONSE } from '@/lib/agents/killSwitch'
import { writeAuditLog } from '@/lib/audit/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // v67: Kill switch check — halts dossier execution when armed
  const { armed } = await checkKillSwitch(supabase)
  if (armed) {
    await writeAuditLog({
      user_id: user.id, action: 'AGENT_RUN_BLOCKED',
      resource_type: 'property.dossier', metadata: { reason: 'kill_switch' },
    })
    return NextResponse.json(KILL_SWITCH_RESPONSE, { status: 503 })
  }

  try {
    const { address, save = true, property_id } = await req.json()

    if (!address?.trim()) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    // Credit check (dossier = 25 credits)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('credits_used_today, credits_limit_daily, tier_code')
      .eq('user_id', user.id)
      .single()

    if (sub && sub.credits_used_today + 25 > sub.credits_limit_daily) {
      return NextResponse.json({
        error: `Daily credit limit reached. Used: ${sub.credits_used_today}/${sub.credits_limit_daily}. Upgrade plan for more.`
      }, { status: 402 })
    }

    const startTime = Date.now()

    // Create agent run record upfront
    let agentRun: { id: string } | null = null
    try {
      const { data } = await supabase.from('agent_runs').insert({
        user_id:     user.id,
        agent_code:  'A01-ORACLE',
        tool_name:   'property.dossier',
        status:      'running',
        input:       { address },
        credits_consumed: 25,
      }).select('id').single()
      agentRun = data
    } catch { /* best-effort, ignore */ }

    const runId = agentRun?.id ?? null

    // ─── Agent Step 1: A12-SPECTER (Investigate) ─────────────────────────────
    const step1Start = Date.now()
    const investigation = await runInvestigator(address)
    const step1Ms = Date.now() - step1Start

    // Save step
    if (runId) {
      try {
        await supabase.from('agent_run_steps').insert({
          run_id:      runId,
          step_number: 1,
          agent_code:  'A12-SPECTER',
          agent_name:  'SPECTER Investigator',
          step_type:   'investigate',
          status:      'done',
          input_json:  { address },
          output_json: investigation,
          duration_ms: step1Ms,
          started_at:  new Date(step1Start).toISOString(),
          finished_at: new Date().toISOString(),
        })
      } catch { /* best-effort, ignore */ }
    }

    // ─── Agent Step 2: A15-OMEN (Underwrite) ─────────────────────────────────
    const step2Start = Date.now()
    const underwriting = await runUnderwriter(investigation)
    const step2Ms = Date.now() - step2Start

    if (runId) {
      try {
        await supabase.from('agent_run_steps').insert({
          run_id:      runId,
          step_number: 2,
          agent_code:  'A15-OMEN',
          agent_name:  'OMEN Underwriter',
          step_type:   'underwrite',
          status:      'done',
          input_json:  { investigation_summary: { address, equity_pct: underwriting.equity_pct } },
          output_json: { mao: underwriting.recommended_offer, grade: underwriting.deal_grade, score: underwriting.distress_score },
          duration_ms: step2Ms,
          started_at:  new Date(step2Start).toISOString(),
          finished_at: new Date().toISOString(),
        })
      } catch { /* best-effort, ignore */ }
    }

    // ─── Agent Step 3: A06-HERALD (Copywrite) ────────────────────────────────
    const step3Start = Date.now()
    const copy = await runCopywriter(investigation, underwriting)
    const step3Ms = Date.now() - step3Start

    if (runId) {
      try {
        await supabase.from('agent_run_steps').insert({
          run_id:      runId,
          step_number: 3,
          agent_code:  'A06-HERALD',
          agent_name:  'HERALD Copywriter',
          step_type:   'copywrite',
          status:      'done',
          input_json:  { address, owner_name: investigation.owner_name },
          output_json: { sms_count: 5, email_count: 2, voicemail: !!copy.voicemail_script },
          duration_ms: step3Ms,
          started_at:  new Date(step3Start).toISOString(),
          finished_at: new Date().toISOString(),
        })
      } catch { /* best-effort, ignore */ }
    }

    const duration_ms = Date.now() - startTime

    // Compose dossier
    const dossier = {
      address:               investigation.address,
      owner_name:            investigation.owner_name,
      owner_phone:           investigation.owner_phone,
      owner_email:           investigation.owner_email,
      owner_mailing_address: investigation.owner_mailing_address,
      // Financial
      equity_pct:            underwriting.equity_pct,
      arv:                   underwriting.arv,
      assessed_value:        investigation.assessed_value,
      estimated_repair:      underwriting.estimated_repair,
      recommended_offer:     underwriting.recommended_offer,
      net_profit_potential:  underwriting.net_profit_potential,
      // Distress
      distress_score:        underwriting.distress_score,
      deal_grade:            underwriting.deal_grade,
      distress_breakdown:    underwriting.distress_breakdown,
      tax_delinquent:        investigation.tax_status === 'delinquent',
      tax_owed:              investigation.tax_owed,
      occupancy:             investigation.occupancy,
      liens:                 investigation.liens,
      // Analysis
      risk_factors:          underwriting.risk_factors,
      investment_thesis:     underwriting.investment_thesis,
      // Outreach
      sms_1:                 copy.sms_1,
      email_subject:         copy.email_3_subject,
      email_body:            copy.email_3_body,
      voicemail:             copy.voicemail_script,
      talking_points:        copy.talking_points,
      loi_intro:             copy.loi_intro,
      full_sequence: {
        sms_1:             copy.sms_1,
        sms_2:             copy.sms_2,
        sms_3:             copy.sms_3,
        email_3_subject:   copy.email_3_subject,
        email_3_body:      copy.email_3_body,
        sms_4:             copy.sms_4,
        sms_5:             copy.sms_5,
        email_6_subject:   copy.email_6_subject,
        email_6_body:      copy.email_6_body,
        sms_7:             copy.sms_7,
      },
      // Property details
      year_built:     investigation.year_built,
      sqft:           investigation.sqft,
      bedrooms:       investigation.bedrooms,
      bathrooms:      investigation.bathrooms,
      // Meta
      agents_used:    ['A12-SPECTER', 'A15-OMEN', 'A06-HERALD'],
      run_id:         runId,
      duration_ms,
      generated_at:   new Date().toISOString(),
    }

    if (save) {
      // Upsert property record
      let savedProperty: { id: string } | null = null
      try {
        const { data } = await supabase.from('properties').upsert({
          user_id:          user.id,
          address:          investigation.address,
          city:             investigation.address.split(',')[1]?.trim() ?? 'Charleston',
          state:            'WV',
          zip:              investigation.address.match(/\d{5}/)?.[0],
          equity_pct:       underwriting.equity_pct,
          arv:              underwriting.arv,
          assessed_value:   investigation.assessed_value,
          estimated_repair: underwriting.estimated_repair,
          recommended_offer: underwriting.recommended_offer,
          net_profit:       underwriting.net_profit_potential,
          distress_score:   underwriting.distress_score,
          deal_grade:       underwriting.deal_grade,
          tax_delinquent:   investigation.tax_status === 'delinquent',
          tax_owed:         investigation.tax_owed,
          owner_name:       investigation.owner_name,
          owner_phone:      investigation.owner_phone,
          owner_email:      investigation.owner_email,
          occupancy:        investigation.occupancy,
          dossier_json:     dossier,
          status:           underwriting.distress_score >= 70 ? 'hot' : underwriting.distress_score >= 50 ? 'warm' : 'cold',
        }, { onConflict: 'user_id,address', ignoreDuplicates: false })
          .select('id').single()
        savedProperty = data
      } catch { /* best-effort, ignore */ }

      const propId = property_id ?? savedProperty?.id ?? null

      // Save artifact
      try {
        await supabase.from('agent_artifacts').insert({
          run_id:         runId,
          user_id:        user.id,
          property_id:    propId,
          artifact_type:  'dossier',
          title:          `Property Dossier: ${address}`,
          content:        JSON.stringify(dossier, null, 2),
          content_json:   dossier,
          model_used:     'claude-sonnet-4-20250514',
          quality_score:  underwriting.distress_score,
        })
      } catch { /* best-effort, ignore */ }

      // Deduct credits
      if (sub) {
        await supabase
          .from('subscriptions')
          .update({ credits_used_today: sub.credits_used_today + 25 })
          .eq('user_id', user.id)
      }

      // Update agent run to completed
      if (runId) {
        try {
          await supabase.from('agent_runs').update({
            status:       'completed',
            output:       dossier,
            duration_ms,
            completed_at: new Date().toISOString(),
          }).eq('id', runId)
        } catch { /* best-effort, ignore */ }
      }

      // Usage event
      try {
        await supabase.from('usage_events').insert({
          user_id: user.id, event_type: 'dossier', resource_id: propId,
          credits_used: 25, model_used: 'claude-sonnet-4-20250514',
        })
      } catch { /* best-effort, ignore */ }
    }

    await writeAuditLog({
      user_id: user.id, action: 'DOSSIER_RUN',
      resource_type: 'property', resource_id: runId ?? undefined,
      metadata: { address, distress_score: underwriting.distress_score, deal_grade: underwriting.deal_grade, duration_ms },
    })

    return NextResponse.json({ ok: true, ...dossier, runId })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Dossier pipeline failed'
    console.error('[Dossier API]', message)
    await writeAuditLog({
      user_id: user.id, action: 'DOSSIER_RUN',
      resource_type: 'property', metadata: { error: message },
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
