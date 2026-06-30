/**
 * THE ARK — Unified Zustand Store
 * All global state lives here. Single source of truth.
 * Isaac Brandon Burdette, Sole Inventor
 * Atlas Genesis Matrix LLC
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Portal =
  | 'dashboard' | 'deals' | 'war-room' | 'skip-trace' | 'ain'
  | 'comms' | 'agents' | 'swarm' | 'market' | 'genesis' | 'signals'
  | 'voice' | 'loi' | 'contractors' | 'pm' | 'legal' | 'transmedia'
  | 'worldforge' | 'akashic' | 'skills' | 'pay' | 'community'
  | 'blueprint' | 'build' | 'expansion' | 'orchestra' | 'autopoietic'
  | 'admin' | 'franchise' | 'vault' | 'patents' | 'onboarding' | 'nasdrop'
  | 'living-graph' | 'cockpit' | 'roadmap' | 'trust' | 'superllm' | 'genesis-hq'
  // ── Added during v67 nav-retrofit (06_AUDIT/D, 07_PLANS/1) ──
  // App Router pages that existed but had no SPA portal slot.
  | 'scoring' | 'top250' | 'pipeline' | 'd4d' | 'underwriting' | 'rehab'
  | 'godmode' | 'agent-runs'

export type TierCode = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'active' | 'standby' | 'offline'

export type ModalType =
  | 'property-detail' | 'lead-detail' | 'agent-run' | 'stripe-checkout'
  | 'loi-preview' | 'skip-trace-result' | 'api-key' | 'neural-call'
  | 'nasdrop-unlock' | null

export interface Property {
  id: string
  address: string
  city: string
  state: string
  zip: string
  county?: string
  equity_pct: number
  arv: number
  asking_price?: number
  assessed_value?: number
  estimated_repair?: number
  recommended_offer?: number
  status: 'hot' | 'warm' | 'cold' | 'closed' | 'passed'
  tax_delinquent: boolean
  tax_owed?: number
  owner_name?: string
  owner_phone?: string
  owner_email?: string
  occupancy?: string
  distress_score?: number
  deal_grade?: string
  acquisition_status?: string
  latitude?: number
  longitude?: number
  dossier_json?: Record<string, unknown>
  created_at: string
}

export interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  property_id?: string
  status: 'new' | 'contacted' | 'negotiating' | 'closed' | 'dead'
  touch_sequence: number
  last_contact?: string
  source?: string
  notes?: string
  created_at: string
}

export interface AgentRun {
  id: string
  agent_code?: string
  tool_name: string
  agent_type?: string
  status: AgentStatus
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  credits_consumed?: number
  tokens_used?: number
  duration_ms?: number
  created_at: string
  completed_at?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  agentCode?: string
}

export interface Subscription {
  tier_code: TierCode
  credits_used_today: number
  credits_limit_daily: number
  stripe_customer_id?: string
  stripe_subscription_id?: string
  status: string
}

export interface NasdropState {
  unlocked: boolean
  typed: string
  lastUnlock?: string
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface ArkStore {
  // ── Navigation ──
  activePortal: Portal
  setActivePortal: (portal: Portal) => void

  // ── Modals ──
  activeModal: ModalType
  modalData: Record<string, unknown>
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void
  closeModal: () => void

  // ── Copilot / Chat ──
  messages: ChatMessage[]
  isStreaming: boolean
  isCopilotOpen: boolean
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateLastMessage: (content: string) => void
  clearMessages: () => void
  setStreaming: (v: boolean) => void
  toggleCopilot: () => void

  // ── Properties ──
  properties: Property[]
  selectedProperty: Property | null
  setProperties: (p: Property[]) => void
  setSelectedProperty: (p: Property | null) => void
  addProperty: (p: Property) => void
  updateProperty: (id: string, updates: Partial<Property>) => void

  // ── Leads ──
  leads: Lead[]
  setLeads: (l: Lead[]) => void
  addLead: (l: Lead) => void
  updateLeadStatus: (id: string, status: Lead['status']) => void

  // ── Agent Runs ──
  agentRuns: AgentRun[]
  activeRun: AgentRun | null
  setAgentRuns: (runs: AgentRun[]) => void
  addAgentRun: (run: AgentRun) => void
  updateAgentRun: (id: string, updates: Partial<AgentRun>) => void
  setActiveRun: (run: AgentRun | null) => void

  // ── Subscription / Credits ──
  subscription: Subscription
  updateSubscription: (updates: Partial<Subscription>) => void
  consumeCredits: (amount: number) => boolean

  // ── NASDROP hidden portal ──
  nasdrop: NasdropState
  handleKeyPress: (key: string) => void
  lockNasdrop: () => void

  // ── Map ──
  mapCenter: [number, number]
  mapZoom: number
  setMapCenter: (coords: [number, number]) => void
  setMapZoom: (zoom: number) => void

  // ── Filters ──
  propertyFilters: {
    minDistressScore: number
    taxDelinquent: boolean
    status: Property['status'] | 'all'
    zipCode: string
    dealGrade: string
  }
  setPropertyFilter: <K extends keyof ArkStore['propertyFilters']>(
    key: K, value: ArkStore['propertyFilters'][K]
  ) => void

  // ── App State ──
  isInitialized: boolean
  safeMode: boolean
  offlineMode: boolean
  setInitialized: (v: boolean) => void
  setSafeMode: (v: boolean) => void

  // ── Command Palette ──
  commandOpen: boolean
  setCommandOpen: (v: boolean) => void
}

// ─── Implementation ───────────────────────────────────────────────────────────

const NASDROP_SEQUENCE = 'nasdrop'

export const useArkStore = create<ArkStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Navigation ──
        activePortal: 'dashboard',
        setActivePortal: (portal) => set({ activePortal: portal }),

        // ── Modals ──
        activeModal: null,
        modalData: {},
        openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
        closeModal: () => set({ activeModal: null, modalData: {} }),

        // ── Copilot ──
        messages: [],
        isStreaming: false,
        isCopilotOpen: true,
        addMessage: (msg) => set((state) => ({
          messages: [...state.messages, { ...msg, id: crypto.randomUUID(), timestamp: Date.now() }]
        })),
        updateLastMessage: (content) => set((state) => {
          const msgs = [...state.messages]
          if (msgs.length > 0) msgs[msgs.length - 1].content = content
          return { messages: msgs }
        }),
        clearMessages: () => set({ messages: [] }),
        setStreaming: (v) => set({ isStreaming: v }),
        toggleCopilot: () => set((s) => ({ isCopilotOpen: !s.isCopilotOpen })),

        // ── Properties ──
        properties: [],
        selectedProperty: null,
        setProperties: (properties) => set({ properties }),
        setSelectedProperty: (selectedProperty) => set({ selectedProperty }),
        addProperty: (p) => set((s) => ({ properties: [p, ...s.properties] })),
        updateProperty: (id, updates) => set((s) => ({
          properties: s.properties.map((p) => p.id === id ? { ...p, ...updates } : p)
        })),

        // ── Leads ──
        leads: [],
        setLeads: (leads) => set({ leads }),
        addLead: (l) => set((s) => ({ leads: [l, ...s.leads] })),
        updateLeadStatus: (id, status) => set((s) => ({
          leads: s.leads.map((l) => l.id === id ? { ...l, status } : l)
        })),

        // ── Agent Runs ──
        agentRuns: [],
        activeRun: null,
        setAgentRuns: (agentRuns) => set({ agentRuns }),
        addAgentRun: (run) => set((s) => ({ agentRuns: [run, ...s.agentRuns] })),
        updateAgentRun: (id, updates) => set((s) => ({
          agentRuns: s.agentRuns.map((r) => r.id === id ? { ...r, ...updates } : r)
        })),
        setActiveRun: (activeRun) => set({ activeRun }),

        // ── Subscription ──
        subscription: {
          tier_code: 'T1',
          credits_used_today: 0,
          credits_limit_daily: 100,
          status: 'active',
        },
        updateSubscription: (updates) => set((s) => ({
          subscription: { ...s.subscription, ...updates }
        })),
        consumeCredits: (amount) => {
          const { subscription } = get()
          if (subscription.credits_used_today + amount > subscription.credits_limit_daily) {
            return false
          }
          set((s) => ({
            subscription: {
              ...s.subscription,
              credits_used_today: s.subscription.credits_used_today + amount,
            }
          }))
          return true
        },

        // ── NASDROP ──
        nasdrop: { unlocked: false, typed: '' },
        handleKeyPress: (key) => {
          const { nasdrop, subscription } = get()
          if (nasdrop.unlocked) return
          // Only T7 can unlock NASDROP
          if (subscription.tier_code !== 'T7') return
          const newTyped = (nasdrop.typed + key).slice(-NASDROP_SEQUENCE.length)
          if (newTyped === NASDROP_SEQUENCE) {
            set({ nasdrop: { unlocked: true, typed: '', lastUnlock: new Date().toISOString() } })
            // Navigate to nasdrop portal
            set({ activePortal: 'nasdrop' })
          } else {
            set({ nasdrop: { ...nasdrop, typed: newTyped } })
          }
        },
        lockNasdrop: () => set({ nasdrop: { unlocked: false, typed: '' } }),

        // ── Map ──
        mapCenter: [-81.6326, 38.3498], // Charleston, WV
        mapZoom: 11,
        setMapCenter: (mapCenter) => set({ mapCenter }),
        setMapZoom: (mapZoom) => set({ mapZoom }),

        // ── Filters ──
        propertyFilters: {
          minDistressScore: 0,
          taxDelinquent: false,
          status: 'all',
          zipCode: '',
          dealGrade: 'all',
        },
        setPropertyFilter: (key, value) => set((s) => ({
          propertyFilters: { ...s.propertyFilters, [key]: value }
        })),

        // ── App State ──
        isInitialized: false,
        safeMode: false,
        offlineMode: false,
        setInitialized: (isInitialized) => set({ isInitialized }),
        setSafeMode: (safeMode) => set({ safeMode }),

        // ── Command Palette ──
        commandOpen: false,
        setCommandOpen: (commandOpen) => set({ commandOpen }),
      }),
      {
        name: 'the-ark-store',
        partialize: (s) => ({
          activePortal: s.activePortal,
          subscription: s.subscription,
          mapCenter: s.mapCenter,
          mapZoom: s.mapZoom,
          propertyFilters: s.propertyFilters,
          safeMode: s.safeMode,
          isCopilotOpen: s.isCopilotOpen,
        }),
      }
    ),
    { name: 'THE ARK' }
  )
)

// Extended portal types (added in v65 supermassive build)
// These are handled via the PORTAL_MAP union type override in page.tsx
// 'living-graph' | 'cockpit' | 'roadmap' | 'trust' are valid portals
