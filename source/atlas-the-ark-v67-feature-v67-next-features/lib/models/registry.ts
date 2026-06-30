// lib/models/registry.ts — Multi-model registry from ATLAS OS v33 Orchestra
// 25+ AI models with metadata for auto-selection and model voting
// © 2026 Atlas Genesis Matrix, LLC

export interface AIModel {
  id: string; name: string; provider: string; icon: string; color: string
  tier: number; cost: string; strengths: string[]; contextWindow: number
  speed: number; quality: number; creativity: number; autoWeight: Record<string, number>
}

export const AI_MODELS: AIModel[] = [
  { id:'claude-opus-4-6',    name:'Claude Opus 4',        provider:'Anthropic', icon:'◈', color:'#d97706', tier:4, cost:'$$$$', strengths:['reasoning','writing','analysis','legal'], contextWindow:200000, speed:2, quality:99, creativity:96, autoWeight:{ writing:99, reasoning:98, legal:97, analysis:96, code:88, realestate:97 } },
  { id:'claude-sonnet-4-6',  name:'Claude Sonnet 4',      provider:'Anthropic', icon:'◈', color:'#f59e0b', tier:3, cost:'$$$',  strengths:['balanced','code','writing'], contextWindow:200000, speed:7, quality:94, creativity:91, autoWeight:{ writing:94, reasoning:92, code:93, analysis:91, realestate:96, balanced:96 } },
  { id:'claude-haiku-4-5-20251001', name:'Claude Haiku',  provider:'Anthropic', icon:'◈', color:'#fbbf24', tier:2, cost:'$',    strengths:['speed','classification','summarization'], contextWindow:200000, speed:10, quality:82, creativity:78, autoWeight:{ speed:95, classification:93, summarize:90, simple:92, cost:95 } },
  { id:'gemini-1.5-flash',   name:'Gemini 1.5 Flash',     provider:'Google',    icon:'♊', color:'#34a853', tier:2, cost:'$',    strengths:['speed','multimodal'], contextWindow:1000000, speed:10, quality:85, creativity:80, autoWeight:{ speed:97, multimodal:88, cost:96 } },
  { id:'gemini-1.5-pro',     name:'Gemini 1.5 Pro',       provider:'Google',    icon:'♊', color:'#4285f4', tier:3, cost:'$$$',  strengths:['multimodal','math','reasoning'], contextWindow:1000000, speed:8, quality:93, creativity:88, autoWeight:{ multimodal:97, math:96, code:94 } },
  { id:'gpt-4o',             name:'GPT-4o',                provider:'OpenAI',    icon:'⬡', color:'#10a37f', tier:3, cost:'$$$',  strengths:['vision','code','tools'], contextWindow:128000, speed:7, quality:93, creativity:90, autoWeight:{ vision:95, code:94, tools:96 } },
  { id:'gpt-4o-mini',        name:'GPT-4o Mini',           provider:'OpenAI',    icon:'⬡', color:'#1a7f64', tier:2, cost:'$',    strengths:['speed','tasks'], contextWindow:128000, speed:10, quality:82, creativity:79, autoWeight:{ speed:94, cost:96, simple:90 } },
  { id:'ollama-llama3',      name:'Ollama: Llama 3.2',     provider:'Ollama',    icon:'💾', color:'#84cc16', tier:1, cost:'free', strengths:['offline','private','local'], contextWindow:128000, speed:6, quality:74, creativity:71, autoWeight:{ offline:100, privacy:100, cost:100 } },
  { id:'ollama-mistral',     name:'Ollama: Mistral',       provider:'Ollama',    icon:'💾', color:'#a3e635', tier:1, cost:'free', strengths:['offline','fast','private'], contextWindow:32000, speed:8, quality:72, creativity:70, autoWeight:{ offline:100, speed:90, cost:100 } },
]

export const TASK_TYPES = [
  { id:'realestate', label:'Real Estate AI',   icon:'🏠', bestModel:'claude-sonnet-4-6',  secondBest:'gpt-4o' },
  { id:'writing',    label:'Creative Writing', icon:'✍️',  bestModel:'claude-opus-4-6',    secondBest:'gpt-4o' },
  { id:'reasoning',  label:'Deep Reasoning',  icon:'🧠', bestModel:'claude-opus-4-6',    secondBest:'claude-sonnet-4-6' },
  { id:'code',       label:'Code',            icon:'💻', bestModel:'claude-sonnet-4-6',  secondBest:'gpt-4o' },
  { id:'speed',      label:'Fast / Bulk',     icon:'⚡', bestModel:'claude-haiku-4-5-20251001', secondBest:'gemini-1.5-flash' },
  { id:'offline',    label:'Offline',         icon:'🔒', bestModel:'ollama-llama3',       secondBest:'ollama-mistral' },
  { id:'legal',      label:'Legal',           icon:'⚖️',  bestModel:'claude-opus-4-6',    secondBest:'claude-sonnet-4-6' },
  { id:'analysis',   label:'Analysis',        icon:'📊', bestModel:'claude-sonnet-4-6',  secondBest:'gpt-4o' },
  { id:'multimodal', label:'Vision',          icon:'👁️',  bestModel:'gpt-4o',              secondBest:'gemini-1.5-pro' },
]

export function selectBestModel(taskType: string): string {
  return TASK_TYPES.find(t => t.id === taskType)?.bestModel ?? 'claude-haiku-4-5-20251001'
}

export const SUBSCRIPTION_TIERS = [
  { id:1, name:'FREE',     price:'$0',      credits:50,     color:'#6b7280' },
  { id:2, name:'SPARK',    price:'$9/mo',   credits:200,    color:'#06b6d4' },
  { id:3, name:'STARTER',  price:'$49/mo',  credits:1000,   color:'#22c55e' },
  { id:4, name:'PRO',      price:'$149/mo', credits:10000,  color:'#00d4ff' },
  { id:5, name:'ELITE',    price:'$349/mo', credits:50000,  color:'#a78bfa' },
  { id:6, name:'GODMODE',  price:'$999/mo', credits:999999, color:'#ff3b3b' },
  { id:7, name:'FOUNDER',  price:'Internal', credits:999999, color:'#fbbf24' },
]
