'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useArkStore, type Portal } from '@/store/useArkStore'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { CopilotPanel } from '@/components/CopilotPanel'
import { CommandPalette } from '@/components/CommandPalette'
import { BetaDisabled } from '@/components/BetaDisabled'

// ─── Active portal imports ────────────────────────────────────────────────────
// Loaded client-side to keep the server build lean and avoid prerendering live data portals.
const DashboardPortal = dynamic(() => import('@/components/portals/Dashboard').then(m => m.DashboardPortal), { ssr: false })
const DealsPortal = dynamic(() => import('@/components/portals/Deals').then(m => m.DealsPortal), { ssr: false })
const AgentLabPortal = dynamic(() => import('@/components/portals/AgentLab').then(m => m.AgentLabPortal), { ssr: false })
const ContractorsPortal = dynamic(() => import('@/components/portals/ContractorPortalFull').then(m => m.ContractorPortalFull), { ssr: false })
const TrustDashboardPortal = dynamic(() => import('@/components/portals/TrustDashboard').then(m => m.TrustDashboardPortal), { ssr: false })
const SettingsPortal = dynamic(() => import('@/components/portals/Settings').then(m => m.SettingsPortal), { ssr: false })
const OnboardingPortal = dynamic(() => import('@/components/portals/Onboarding').then(m => m.OnboardingPortal), { ssr: false })
const PhaseRoadmapPortal = dynamic(() => import('@/components/portals/PhaseRoadmap').then(m => m.PhaseRoadmapPortal), { ssr: false })
const LOIPortal = dynamic(() => import('@/components/portals/LOI').then(m => m.LOIPortal), { ssr: false })
const CommsPortal = dynamic(() => import('@/components/portals/Comms').then(m => m.CommsPortal), { ssr: false })
const MarketPortal = dynamic(() => import('@/components/portals/Market').then(m => m.MarketPortal), { ssr: false })
const AdminPortal = dynamic(() => import('@/components/portals/AdminPortal').then(m => m.AdminPortal), { ssr: false })
const LivingGraphPortal = dynamic(() => import('@/components/portals/LivingGraph').then(m => m.LivingGraphPortal), { ssr: false })
const WorldForgePortal = dynamic(() => import('@/components/portals/WorldForge').then(m => m.WorldForgePortal), { ssr: false })
const GenesisPortal = dynamic(() => import('@/components/portals/Genesis').then(m => m.GenesisPortal), { ssr: false })
const NasdropPortal = dynamic(() => import('@/components/portals/Nasdrop').then(m => m.NasdropPortal), { ssr: false })
const CognitiveCockpitPortal = dynamic(() => import('@/components/portals/CognitiveCockpit').then(m => m.CognitiveCockpitPortal), { ssr: false })
const WarRoomPortal = dynamic(() => import('@/components/portals/WarRoom').then(m => m.WarRoomPortal), { ssr: false })
const SkillsPortal = dynamic(() => import('@/components/portals/Skills').then(m => m.SkillsPortal), { ssr: false })
const SuperLLMPortal = dynamic(() => import('@/components/portals/SuperLLM').then(m => m.SuperLLM), { ssr: false })
const GenesisHQPortal = dynamic(() => import('@/components/portals/GenesisHQ').then(m => m.GenesisHQPortal), { ssr: false })
const AutopoieticConsolePortal = dynamic(() => import('@/components/portals/AutopoieticConsole').then(m => m.AutopoieticConsolePortal), { ssr: false })
const SignalStackPortal = dynamic(() => import('@/components/portals/SignalStack').then(m => m.SignalStackPortal), { ssr: false })
const AINHeatmapPortal = dynamic(() => import('@/app/(app)/ain/page'), { ssr: false })
// ── Added during v67 nav-retrofit (06_AUDIT/D, 07_PLANS/1) ──
// These App Router pages were fully built but had no SPA portal slot — same
// pattern as the AIN heatmap above. All are 'use client' pages with no props.
const ScoringPortal = dynamic(() => import('@/app/(app)/scoring/page'), { ssr: false })
const Top250Portal = dynamic(() => import('@/app/(app)/top250/page'), { ssr: false })
const PipelinePortal = dynamic(() => import('@/app/(app)/pipeline/page'), { ssr: false })
const D4DPortal = dynamic(() => import('@/app/(app)/d4d/page'), { ssr: false })
const UnderwritingPortal = dynamic(() => import('@/app/(app)/underwriting/page'), { ssr: false })
const RehabPortal = dynamic(() => import('@/app/(app)/rehab/page'), { ssr: false })
const GodModePortal = dynamic(() => import('@/app/(app)/godmode/page'), { ssr: false })
const AgentRunsPortal = dynamic(() => import('@/app/(app)/agents/page'), { ssr: false })

// ─── Beta-disabled stubs (portals with no working backend yet) ────────────────
const PreviewPortal = ({ name, reason }: { name: string; reason?: string }) => (
  <BetaDisabled portalName={name} reason={reason} />
)

// ─── Portal map ───────────────────────────────────────────────────────────────
// Portals marked LIVE are fully working for beta testers
// Portals marked PREVIEW are visible but show beta-disabled state
// Portals marked HIDDEN are admin/owner only

const PORTAL_MAP: Record<Portal, React.ReactNode> = {
  // ── LIVE ──────────────────────────────────────────────────────────────────
  'dashboard':    <DashboardPortal />,
  'deals':        <DealsPortal />,
  'agents':       <AgentLabPortal />,
  'contractors':  <ContractorsPortal />,
  'trust':        <TrustDashboardPortal />,
  'vault':        <SettingsPortal />,
  'onboarding':   <OnboardingPortal />,
  'roadmap':      <PhaseRoadmapPortal />,
  'loi':          <LOIPortal />,
  'comms':        <CommsPortal />,
  'market':       <MarketPortal />,
  'admin':        <AdminPortal />,
  'genesis-hq':   <GenesisHQPortal />,
  'ain':          <AINHeatmapPortal />,
  'scoring':      <ScoringPortal />,
  'top250':       <Top250Portal />,
  'pipeline':     <PipelinePortal />,
  'd4d':          <D4DPortal />,
  'underwriting': <UnderwritingPortal />,
  'rehab':        <RehabPortal />,
  'godmode':      <GodModePortal />,
  'agent-runs':   <AgentRunsPortal />,

  // ── PREVIEW (owner/admin can explore) ────────────────────────────────────
  'living-graph': <LivingGraphPortal />,
  'worldforge':   <WorldForgePortal />,
  'genesis':      <GenesisPortal />,
  'nasdrop':      <NasdropPortal />,
  'cockpit':      <CognitiveCockpitPortal />,
  'war-room':     <WarRoomPortal />,

  // ── COMING SOON (beta-disabled stubs) ────────────────────────────────────
  'skip-trace':   <PreviewPortal name="Skip Trace (A12-SPECTER)" reason="Requires BatchSkipTracing API integration — coming in v66." />,
  'swarm':        <PreviewPortal name="Swarm Nexus" reason="Multi-agent orchestration via LangGraph — coming in v67." />,
  'signals':      <SignalStackPortal />,
  'voice':        <PreviewPortal name="Voice Agent" reason="Twilio Voice + A2P 10DLC required — coming after SMS registration." />,
  'transmedia':   <PreviewPortal name="Transmedia Universe" reason="Leon Therano saga + WorldForge engine — Phase 3 production feature." />,
  'akashic':      <PreviewPortal name="Akashic Records" reason="Document vault with vector search — coming in v66." />,
  'skills':       <SkillsPortal />,  // v66: real component
  'pay':          <PreviewPortal name="Billing & Plans" reason="Stripe billing requires price ID setup — see DEPLOYMENT_CHECKLIST.md." />,
  'community':    <PreviewPortal name="Community Hub" reason="Beta tester community — launching after 10 active users." />,
  'autopoietic':  <AutopoieticConsolePortal />,
  'superllm':     <SuperLLMPortal activePortal="superllm" />,
  'franchise':    <PreviewPortal name="Franchise Console" reason="Multi-location ARK deployment — enterprise tier feature." />,
  'patents':      <PreviewPortal name="Patent Registry" reason="IP management portal — coming in v66." />,
  'expansion':    <PreviewPortal name="Market Expansion" reason="Geographic expansion intelligence — coming in v66." />,
  'orchestra':    <PreviewPortal name="Orchestra" reason="Workflow automation engine — coming in v66." />,
  'blueprint':    <PreviewPortal name="Blueprint Intel" reason="Architectural intelligence layer — coming in v66." />,
  'build':        <ContractorsPortal />, // reuse contractors for now
  'pm':           <ContractorsPortal />,
  'legal':        <PreviewPortal name="Legal Hub" reason="Contract library and compliance tools — coming in v66." />,
}

export default function TheArk() {
  const { activePortal, handleKeyPress, setInitialized } = useArkStore()

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return
    handleKeyPress(e.key.toLowerCase())
  }, [handleKeyPress])

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    setInitialized(true)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown, setInitialized])

  return (
    <div className="flex h-screen bg-atlas-void overflow-hidden text-atlas-text">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {PORTAL_MAP[activePortal] ?? PORTAL_MAP['dashboard']}
        </main>
      </div>
      <CopilotPanel />
      <CommandPalette />
    </div>
  )
}
