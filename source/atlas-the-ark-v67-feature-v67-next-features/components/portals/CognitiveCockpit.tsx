'use client'

import { useState } from 'react'
import { useArkStore } from '@/store/useArkStore'
import { Sliders, Zap, Save } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

type Preset = 'Explorer' | 'Builder' | 'Investor' | 'Contractor' | 'Researcher' | 'Inventor' | 'CEO' | 'God Mode'

const PRESETS: Record<Preset, Record<string, number>> = {
  Explorer:   { research_depth:80, graph_exploration:90, discovery:70, creativity:60, risk_tolerance:40 },
  Builder:    { research_depth:50, graph_exploration:50, agent_autonomy:60, workflow_automation:70, construction:80 },
  Investor:   { research_depth:70, opportunity_search:90, risk_tolerance:40, financial_conservatism:30, empire_mode:70 },
  Contractor: { construction:90,   estimating:90,        compliance:80,   workflow_automation:70, risk_tolerance:50 },
  Researcher: { research_depth:90, evidence_weight:90,   source_diversity:80, historical_depth:80, creativity:70 },
  Inventor:   { creativity:90,     invention_mode:90,    patent_detection:80, novelty:80, possibility:80 },
  CEO:        { empire_mode:80,    portfolio_scope:80,   strategic_innovation:70, agent_autonomy:60, long_term_horizon:80 },
  'God Mode': { research_depth:100, creativity:100, agent_autonomy:80, empire_mode:100, tournament_level:7, model_count:7 },
}

interface PanelConfig {
  name: string
  color: string
  sliders: { key: string; label: string }[]
}

const PANELS: PanelConfig[] = [
  { name: 'Intelligence Depth', color: '#63b3ed', sliders: [
    { key: 'research_depth', label: 'Research Depth' },
    { key: 'relationship_depth', label: 'Relationship Depth' },
    { key: 'graph_exploration', label: 'Graph Exploration' },
    { key: 'memory_recall', label: 'Memory Recall' },
    { key: 'knowledge_radius', label: 'Knowledge Radius' },
    { key: 'evidence_weight', label: 'Evidence Weight' },
    { key: 'source_diversity', label: 'Source Diversity' },
    { key: 'historical_depth', label: 'Historical Depth' },
    { key: 'context_expansion', label: 'Context Expansion' },
    { key: 'reasoning_depth', label: 'Reasoning Depth' },
  ]},
  { name: 'Discovery', color: '#68d391', sliders: [
    { key: 'opportunity_search', label: 'Opportunity Search' },
    { key: 'connection_discovery', label: 'Connection Discovery' },
    { key: 'cross_domain', label: 'Cross-Domain' },
    { key: 'pattern_detection', label: 'Pattern Detection' },
    { key: 'missing_info_scan', label: 'Missing Info Scan' },
    { key: 'weak_signal_detection', label: 'Weak Signal' },
    { key: 'revenue_discovery', label: 'Revenue Discovery' },
    { key: 'automation_discovery', label: 'Automation Discovery' },
    { key: 'business_opportunity', label: 'Business Opportunity' },
    { key: 'serendipity_factor', label: 'Serendipity' },
  ]},
  { name: 'Creativity', color: '#b794f4', sliders: [
    { key: 'creativity_level', label: 'Creativity Level' },
    { key: 'novelty_preference', label: 'Novelty Preference' },
    { key: 'invention_mode', label: 'Invention Mode' },
    { key: 'patent_detection', label: 'Patent Detection' },
    { key: 'idea_generation', label: 'Idea Generation' },
    { key: 'worldbuilding_depth', label: 'Worldbuilding Depth' },
    { key: 'product_ideation', label: 'Product Ideation' },
    { key: 'business_creativity', label: 'Business Creativity' },
    { key: 'design_thinking', label: 'Design Thinking' },
    { key: 'strategic_innovation', label: 'Strategic Innovation' },
  ]},
  { name: 'Risk', color: '#fc8181', sliders: [
    { key: 'risk_tolerance', label: 'Risk Tolerance' },
    { key: 'compliance_strictness', label: 'Compliance Strictness' },
    { key: 'evidence_requirement', label: 'Evidence Requirement' },
    { key: 'verification_level', label: 'Verification Level' },
    { key: 'legal_sensitivity', label: 'Legal Sensitivity' },
    { key: 'financial_conservatism', label: 'Financial Conservatism' },
    { key: 'confidence_threshold', label: 'Confidence Threshold' },
    { key: 'error_sensitivity', label: 'Error Sensitivity' },
    { key: 'safety_margin', label: 'Safety Margin' },
    { key: 'uncertainty_visibility', label: 'Uncertainty Visibility' },
  ]},
  { name: 'Tournament', color: '#4fd1c5', sliders: [
    { key: 'model_count', label: 'Model Count (1-7)' },
    { key: 'debate_depth', label: 'Debate Depth' },
    { key: 'critique_depth', label: 'Critique Depth' },
    { key: 'consensus_threshold', label: 'Consensus Threshold' },
    { key: 'disagreement_detection', label: 'Disagreement Detection' },
    { key: 'synthesis_depth', label: 'Synthesis Depth' },
    { key: 'reasoning_transparency', label: 'Reasoning Transparency' },
    { key: 'cost_budget_tournament', label: 'Cost Budget' },
    { key: 'latency_tolerance', label: 'Latency Tolerance' },
    { key: 'model_diversity', label: 'Model Diversity' },
  ]},
  { name: 'Agent Autonomy', color: '#f6ad55', sliders: [
    { key: 'agent_autonomy', label: 'Autonomy Level' },
    { key: 'task_creation_rate', label: 'Task Creation Rate' },
    { key: 'recommendation_freq', label: 'Recommendation Freq' },
    { key: 'workflow_automation', label: 'Workflow Automation' },
    { key: 'self_improvement_rate', label: 'Self-Improvement Rate' },
    { key: 'agent_collaboration', label: 'Collaboration' },
    { key: 'agent_independence', label: 'Independence' },
    { key: 'escalation_threshold', label: 'Escalation Threshold' },
    { key: 'execution_authority', label: 'Execution Authority' },
    { key: 'learning_rate', label: 'Learning Rate' },
  ]},
  { name: 'Kanban Intelligence', color: '#f687b3', sliders: [
    { key: 'card_creation_rate', label: 'Card Creation Rate' },
    { key: 'opportunity_sensitivity', label: 'Opportunity Sensitivity' },
    { key: 'risk_sensitivity', label: 'Risk Sensitivity' },
    { key: 'prioritization_aggression', label: 'Prioritization' },
    { key: 'auto_assignment', label: 'Auto-Assignment' },
    { key: 'workflow_generation', label: 'Workflow Generation' },
    { key: 'dependency_detection', label: 'Dependency Detection' },
    { key: 'escalation_speed', label: 'Escalation Speed' },
    { key: 'completion_forecasting', label: 'Completion Forecasting' },
    { key: 'learn_from_outcomes', label: 'Learn from Outcomes' },
  ]},
  { name: 'Mind Map & Graph', color: '#63b3ed', sliders: [
    { key: 'node_density', label: 'Node Density' },
    { key: 'relationship_visibility', label: 'Relationship Visibility' },
    { key: 'cluster_detection', label: 'Cluster Detection' },
    { key: 'graph_expansion_rate', label: 'Graph Expansion' },
    { key: 'compression_level', label: 'Compression Level' },
    { key: 'timeline_depth', label: 'Timeline Depth' },
    { key: 'entity_linking', label: 'Entity Linking' },
    { key: 'similarity_search', label: 'Similarity Search' },
    { key: 'relationship_weighting', label: 'Relationship Weighting' },
    { key: 'graph_depth', label: 'Graph Depth' },
  ]},
  { name: 'Reality Engine', color: '#4fd1c5', sliders: [
    { key: 'map_detail', label: 'Map Detail' },
    { key: 'gis_detail', label: 'GIS Detail' },
    { key: 'twin_detail', label: 'Digital Twin Detail' },
    { key: 'lidar_resolution', label: 'LiDAR Resolution' },
    { key: 'drone_depth', label: 'Drone Depth' },
    { key: 'forecast_horizon', label: 'Forecast Horizon' },
    { key: 'simulation_detail', label: 'Simulation Detail' },
    { key: 'asset_tracking', label: 'Asset Tracking' },
    { key: 'capture_frequency', label: 'Capture Frequency' },
    { key: 'world_model_expansion', label: 'World Model Expansion' },
  ]},
  { name: 'Empire Mode', color: '#f6ad55', sliders: [
    { key: 'portfolio_scope', label: 'Portfolio Scope' },
    { key: 'business_scope', label: 'Business Scope' },
    { key: 'cross_company', label: 'Cross-Company' },
    { key: 'investment_aggression', label: 'Investment Aggression' },
    { key: 'revenue_optimization', label: 'Revenue Optimization' },
    { key: 'resource_optimization', label: 'Resource Optimization' },
    { key: 'market_expansion', label: 'Market Expansion' },
    { key: 'acquisition_aggression', label: 'Acquisition Aggression' },
    { key: 'long_term_horizon', label: 'Long-Term Horizon' },
    { key: 'empire_intelligence', label: 'Empire Intelligence' },
  ]},
]

export function CognitiveCockpitPortal() {
  const { subscription } = useArkStore()
  const [activePanel, setActivePanel] = useState(0)
  const [activePreset, setActivePreset] = useState<Preset>('Builder')
  const [values, setValues] = useState<Record<string, number>>(
    PRESETS['Builder']
  )

  function applyPreset(preset: Preset) {
    setActivePreset(preset)
    setValues(prev => ({ ...prev, ...PRESETS[preset] }))
    toast.success(`Preset "${preset}" applied`)
  }

  function setValue(key: string, val: number) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  function getVal(key: string): number {
    return values[key] ?? 50
  }

  const panel = PANELS[activePanel]

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-atlas-accent flex items-center gap-2">
          <Sliders size={14} /> Cognitive Cockpit — 10 Panels · 100 Sliders
        </h1>
        <button
          onClick={() => toast.success('Settings saved')}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-atlas-accent/15 border border-atlas-accent/30 text-atlas-accent hover:bg-atlas-accent/25 transition-all"
        >
          <Save size={12} /> Save Settings
        </button>
      </div>

      {/* 8 Presets */}
      <div className="atlas-panel rounded-xl p-3">
        <div className="text-[9px] text-atlas-muted uppercase tracking-widest mb-2">8 Presets</div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(PRESETS) as Preset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                activePreset === preset
                  ? 'bg-atlas-gold/15 border-atlas-gold/40 text-atlas-gold'
                  : 'border-atlas-border text-atlas-muted hover:text-atlas-text hover:border-atlas-border'
              )}
            >
              {preset}
              {preset === 'God Mode' && <span className="ml-1 text-[8px]">👑</span>}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-atlas-muted mt-2">
          Every slider drives: Graph → Kanban → Agent Selection → Tournament → Recommendations → Workflows → UI. Raising one slider auto-cascades.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {/* Panel tabs */}
        <div className="col-span-1 space-y-1">
          {PANELS.map((p, i) => (
            <button
              key={i}
              onClick={() => setActivePanel(i)}
              className={clsx(
                'w-full text-left px-2.5 py-2 rounded-lg text-[10px] transition-all border',
                activePanel === i
                  ? 'text-atlas-text font-semibold'
                  : 'border-transparent text-atlas-muted hover:text-atlas-text hover:bg-white/3'
              )}
              style={activePanel === i ? { borderColor: p.color + '40', background: p.color + '10' } : undefined}
            >
              <span style={{ color: activePanel === i ? p.color : undefined }}>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Active panel sliders */}
        <div className="col-span-4 atlas-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: panel.color }} />
            <span className="text-xs font-bold text-atlas-text">{panel.name}</span>
            <span className="text-[9px] text-atlas-muted ml-auto">
              Avg: {Math.round(panel.sliders.reduce((s, sl) => s + getVal(sl.key), 0) / panel.sliders.length)}
            </span>
          </div>
          <div className="space-y-3">
            {panel.sliders.map((slider) => {
              const val = getVal(slider.key)
              return (
                <div key={slider.key}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-atlas-muted">{slider.label}</span>
                    <span className="font-mono font-bold" style={{ color: panel.color }}>{val}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={0} max={100} value={val}
                      onChange={(e) => setValue(slider.key, parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${panel.color} ${val}%, rgba(255,255,255,0.1) ${val}%)`
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
