// lib/genesis-hq/seed-data.ts
// ATLAS v22 — Genesis HQ — Seed Data
// Extracted from GenesisCommandCenter prototype
// Owner: Isaac Brandon Burdette / Atlas Genesis Matrix LLC
//
// This data is used for idempotent seeding of genesis_hq_* tables.
// Do NOT use source ids (p1, a1, t1) as DB primary keys.
// They are preserved as slug/source_key/source_number fields only.

import type {
  GenesisHqPriority,
  GenesisHqPhaseStatus,
  GenesisHqIdeaCategory,
  GenesisHqKanbanColumnKey,
} from "./types";

// ─── PHASES ────────────────────────────────────────────────────

export const SEED_PHASES: Array<{
  slug: string;
  label: string;
  title: string;
  color: string;
  status: GenesisHqPhaseStatus;
  eta: string;
  sort_order: number;
}> = [
  { slug: "p1", label: "PHASE 1", title: "FOUNDATION & PROTECTION", color: "#00f5c4", status: "active", eta: "Weeks 1–4", sort_order: 1 },
  { slug: "p2", label: "PHASE 2", title: "CORE ENGINE BUILD", color: "#ff6b35", status: "planned", eta: "Weeks 5–12", sort_order: 2 },
  { slug: "p3", label: "PHASE 3", title: "APP UNIFICATION", color: "#a855f7", status: "planned", eta: "Weeks 13–20", sort_order: 3 },
  { slug: "p4", label: "PHASE 4", title: "BETA LAUNCH", color: "#facc15", status: "planned", eta: "Weeks 21–28", sort_order: 4 },
  { slug: "p5", label: "PHASE 5", title: "SCALE & MONETIZE", color: "#ec4899", status: "future", eta: "Months 7–12", sort_order: 5 },
];

// ─── AREAS ─────────────────────────────────────────────────────

export const SEED_AREAS: Array<{
  slug: string;
  phase_slug: string;
  title: string;
  icon: string;
  sort_order: number;
}> = [
  { slug: "a1", phase_slug: "p1", title: "IP & Patent Defensive Moat", icon: "🛡️", sort_order: 1 },
  { slug: "a2", phase_slug: "p1", title: "Architecture Unification", icon: "🏗️", sort_order: 2 },
  { slug: "a3", phase_slug: "p2", title: "Genesis Engine (Universal Ingestion)", icon: "⚡", sort_order: 1 },
  { slug: "a4", phase_slug: "p2", title: "TransMedia Generation Engine", icon: "🎬", sort_order: 2 },
  { slug: "a5", phase_slug: "p3", title: "Four Apps → One Super App", icon: "🔮", sort_order: 1 },
  { slug: "a6", phase_slug: "p4", title: "Beta Test Program", icon: "🚀", sort_order: 1 },
  { slug: "a7", phase_slug: "p4", title: "Books & TransMedia Content", icon: "📚", sort_order: 2 },
  { slug: "a8", phase_slug: "p5", title: "Revenue & Protection Moat", icon: "💎", sort_order: 1 },
];

// ─── TASKS ─────────────────────────────────────────────────────

export const SEED_TASKS: Array<{
  source_key: string;
  area_slug: string;
  text: string;
  priority: GenesisHqPriority;
  sort_order: number;
}> = [
  // a1 — IP & Patent Defensive Moat
  { source_key: "t1", area_slug: "a1", text: "File provisional patents for Genesis Engine ingestion system", priority: "critical", sort_order: 1 },
  { source_key: "t2", area_slug: "a1", text: "Document all novel algorithms with timestamps (git + notarization)", priority: "critical", sort_order: 2 },
  { source_key: "t3", area_slug: "a1", text: "Trademark: Genesis Engine, TransMedia Engine, brand names", priority: "high", sort_order: 3 },
  { source_key: "t4", area_slug: "a1", text: "File trade secret protocols for proprietary AI pipelines", priority: "high", sort_order: 4 },
  { source_key: "t5", area_slug: "a1", text: "Create defensive publication disclosures for 100 ideas", priority: "medium", sort_order: 5 },
  { source_key: "t6", area_slug: "a1", text: "Engage IP attorney for freedom-to-operate analysis", priority: "high", sort_order: 6 },
  { source_key: "t7", area_slug: "a1", text: "Copyright all written works, books, transmedia content", priority: "medium", sort_order: 7 },
  // a2 — Architecture Unification
  { source_key: "t8", area_slug: "a2", text: "Audit all 4 apps — map overlapping features and data models", priority: "critical", sort_order: 1 },
  { source_key: "t9", area_slug: "a2", text: "Define unified API layer / microservice schema", priority: "critical", sort_order: 2 },
  { source_key: "t10", area_slug: "a2", text: "Choose monorepo structure (Turborepo / Nx)", priority: "high", sort_order: 3 },
  { source_key: "t11", area_slug: "a2", text: "Migrate all GitHub repos under one org with access controls", priority: "high", sort_order: 4 },
  { source_key: "t12", area_slug: "a2", text: "Set up Vercel project matrix with env separation", priority: "medium", sort_order: 5 },
  // a3 — Genesis Engine
  { source_key: "t13", area_slug: "a3", text: "Build universal content parser (PDF, video, audio, web, docs)", priority: "critical", sort_order: 1 },
  { source_key: "t14", area_slug: "a3", text: "Connect Google Drive API bidirectional sync", priority: "critical", sort_order: 2 },
  { source_key: "t15", area_slug: "a3", text: "Build YouTube transcript + metadata extractor", priority: "high", sort_order: 3 },
  { source_key: "t16", area_slug: "a3", text: "Connect Gmail, Google Calendar as context sources", priority: "high", sort_order: 4 },
  { source_key: "t17", area_slug: "a3", text: "Build ChatGPT / Claude / Gemini chat history importer", priority: "high", sort_order: 5 },
  { source_key: "t18", area_slug: "a3", text: "GitHub repo code ingestion + semantic indexing", priority: "medium", sort_order: 6 },
  { source_key: "t19", area_slug: "a3", text: "Google Notebook export bridge", priority: "medium", sort_order: 7 },
  { source_key: "t20", area_slug: "a3", text: "Build privacy firewall — user controls all data sharing", priority: "critical", sort_order: 8 },
  { source_key: "t21", area_slug: "a3", text: "Local-first encrypted data vault (user owns their data)", priority: "critical", sort_order: 9 },
  // a4 — TransMedia Generation
  { source_key: "t22", area_slug: "a4", text: "Input-to-output transformer (any format → any format)", priority: "critical", sort_order: 1 },
  { source_key: "t23", area_slug: "a4", text: "PDF/Guide/Roadmap generator pipeline", priority: "high", sort_order: 2 },
  { source_key: "t24", area_slug: "a4", text: "Slideshow/presentation auto-generator", priority: "high", sort_order: 3 },
  { source_key: "t25", area_slug: "a4", text: "Podcast script + audio generation pipeline", priority: "high", sort_order: 4 },
  { source_key: "t26", area_slug: "a4", text: "YouTube video script + storyboard generator", priority: "medium", sort_order: 5 },
  { source_key: "t27", area_slug: "a4", text: "Audiobook creator from any source material", priority: "medium", sort_order: 6 },
  { source_key: "t28", area_slug: "a4", text: "Interactive mind map auto-generator from content", priority: "medium", sort_order: 7 },
  { source_key: "t29", area_slug: "a4", text: "Spreadsheet + data viz auto-generator", priority: "medium", sort_order: 8 },
  // a5 — App Unification
  { source_key: "t30", area_slug: "a5", text: "Unified authentication system (SSO across all apps)", priority: "critical", sort_order: 1 },
  { source_key: "t31", area_slug: "a5", text: "Shared component library across all 4 apps", priority: "high", sort_order: 2 },
  { source_key: "t32", area_slug: "a5", text: "Unified dashboard / command center UI", priority: "critical", sort_order: 3 },
  { source_key: "t33", area_slug: "a5", text: "Cross-app data sharing layer", priority: "high", sort_order: 4 },
  { source_key: "t34", area_slug: "a5", text: "App 1: Complete remaining features + test", priority: "high", sort_order: 5 },
  { source_key: "t35", area_slug: "a5", text: "App 2: Complete remaining features + test", priority: "high", sort_order: 6 },
  { source_key: "t36", area_slug: "a5", text: "App 3: Complete remaining features + test", priority: "high", sort_order: 7 },
  { source_key: "t37", area_slug: "a5", text: "App 4: Complete remaining features + test", priority: "high", sort_order: 8 },
  { source_key: "t38", area_slug: "a5", text: "Merge all 4 apps into unified navigation shell", priority: "critical", sort_order: 9 },
  // a6 — Beta Test Program
  { source_key: "t39", area_slug: "a6", text: "Build waitlist landing page with NDA capture", priority: "critical", sort_order: 1 },
  { source_key: "t40", area_slug: "a6", text: "Define 50-user closed beta cohort criteria", priority: "high", sort_order: 2 },
  { source_key: "t41", area_slug: "a6", text: "Set up beta feedback system (in-app + surveys)", priority: "high", sort_order: 3 },
  { source_key: "t42", area_slug: "a6", text: "Create onboarding flow for beta users", priority: "high", sort_order: 4 },
  { source_key: "t43", area_slug: "a6", text: "Set up analytics (privacy-respecting) for beta", priority: "medium", sort_order: 5 },
  { source_key: "t44", area_slug: "a6", text: "Recruit beta users from trusted network first", priority: "high", sort_order: 6 },
  { source_key: "t45", area_slug: "a6", text: "Week 1 beta: 10 users, collect daily feedback", priority: "high", sort_order: 7 },
  { source_key: "t46", area_slug: "a6", text: "Week 2-4 beta: expand to 50 users", priority: "medium", sort_order: 8 },
  { source_key: "t47", area_slug: "a6", text: "Beta retrospective + feature prioritization", priority: "medium", sort_order: 9 },
  // a7 — Books & TransMedia
  { source_key: "t48", area_slug: "a7", text: "Finalize book 1 outline using Genesis Engine", priority: "high", sort_order: 1 },
  { source_key: "t49", area_slug: "a7", text: "Create transmedia content bible", priority: "medium", sort_order: 2 },
  { source_key: "t50", area_slug: "a7", text: "Publish first chapter as lead magnet", priority: "medium", sort_order: 3 },
  { source_key: "t51", area_slug: "a7", text: "Build companion app experience for books", priority: "low", sort_order: 4 },
  // a8 — Revenue & Protection Moat
  { source_key: "t52", area_slug: "a8", text: "Launch tiered subscription model", priority: "high", sort_order: 1 },
  { source_key: "t53", area_slug: "a8", text: "Utility patents filed for core novel innovations", priority: "critical", sort_order: 2 },
  { source_key: "t54", area_slug: "a8", text: "Developer API + marketplace launch", priority: "high", sort_order: 3 },
  { source_key: "t55", area_slug: "a8", text: "Partnership/licensing deals", priority: "medium", sort_order: 4 },
  { source_key: "t56", area_slug: "a8", text: "Series A fundraise prep", priority: "medium", sort_order: 5 },
];

// ─── KANBAN COLUMNS ─────────────────────────────────────────────

export const SEED_KANBAN_COLUMNS: Array<{
  key: GenesisHqKanbanColumnKey;
  label: string;
  color: string;
  sort_order: number;
}> = [
  { key: "backlog", label: "BACKLOG", color: "#444444", sort_order: 1 },
  { key: "inprogress", label: "IN PROGRESS", color: "#3b82f6", sort_order: 2 },
  { key: "review", label: "REVIEW", color: "#facc15", sort_order: 3 },
  { key: "done", label: "DONE", color: "#00f5c4", sort_order: 4 },
];

// ─── IDEAS ─────────────────────────────────────────────────────

export const SEED_IDEAS: Array<{
  source_number: number;
  category: GenesisHqIdeaCategory;
  title: string;
  description: string;
  patent_direction: string;
}> = [
  // CAPTURE (1-20)
  { source_number: 1, category: "CAPTURE", title: "Ambient Context Harvester", description: "Browser extension that passively indexes all pages visited (locally) and makes them searchable within your system — zero data leaving your device.", patent_direction: "Local-first semantic indexing with user-controlled purge controls" },
  { source_number: 2, category: "CAPTURE", title: "Universal Clipboard Intelligence", description: "Anything copied to clipboard is auto-tagged, categorized, and stored in your personal knowledge vault.", patent_direction: "Cross-app clipboard semantic classification engine" },
  { source_number: 3, category: "CAPTURE", title: "Screen-to-Knowledge Recorder", description: "Screen recording AI that watches what you're working on, extracts key information, and auto-creates structured notes.", patent_direction: "Real-time visual context extraction from screen activity" },
  { source_number: 4, category: "CAPTURE", title: "Voice-to-Everything Pipeline", description: "Record voice memos anywhere → auto-transcribe → classify → route to the correct project/context.", patent_direction: "Contextual voice memo routing with project affinity scoring" },
  { source_number: 5, category: "CAPTURE", title: "Email Intelligence Extractor", description: "AI reads your email threads and extracts decisions, action items, and knowledge into your vault without storing raw emails.", patent_direction: "Privacy-preserving email knowledge distillation (summaries not originals)" },
  { source_number: 6, category: "CAPTURE", title: "Cross-Platform Chat Harvester", description: "Import conversations from ChatGPT, Claude, Gemini, DeepSeek into unified timeline with semantic search.", patent_direction: "Multi-LLM conversation unification protocol with session bridging" },
  { source_number: 7, category: "CAPTURE", title: "YouTube Deep Extractor", description: "Beyond transcripts — extracts concepts, timestamps, speakers, visual elements described, and creates mind maps from any video.", patent_direction: "Multi-modal video knowledge graph extraction system" },
  { source_number: 8, category: "CAPTURE", title: "PDF Semantic Splitter", description: "Automatically splits PDFs into concept chunks, links related chunks across different documents.", patent_direction: "Cross-document semantic fragment linking engine" },
  { source_number: 9, category: "CAPTURE", title: "Phone Screen Mirror Sync", description: "Opt-in phone app that syncs notes, voice memos, photos of whiteboards directly to your command center.", patent_direction: "Consent-gated mobile-to-vault synchronization with local processing" },
  { source_number: 10, category: "CAPTURE", title: "Social Listening Vault", description: "Capture your own posts, comments, threads across platforms into a searchable personal media archive.", patent_direction: "User-owned social content archiving with platform-agnostic export" },
  { source_number: 11, category: "CAPTURE", title: "Book Highlight Aggregator", description: "Imports Kindle highlights, Readwise notes, physical book photos into a unified reading knowledge base.", patent_direction: "Multi-source reading annotation unification with concept mapping" },
  { source_number: 12, category: "CAPTURE", title: "Meeting Intelligence Recorder", description: "Joins Zoom/Meet/Teams with permission, extracts decisions and action items only — never stores full recording.", patent_direction: "Meeting decision extraction with privacy-by-design architecture" },
  { source_number: 13, category: "CAPTURE", title: "GitHub Project Contextualizer", description: "Reads your repos, commit history, README files and builds a semantic map of your technical projects.", patent_direction: "Source code project knowledge graph with intent extraction" },
  { source_number: 14, category: "CAPTURE", title: "Podcast Knowledge Miner", description: "Subscribe to podcasts; AI extracts and indexes key ideas, quotes, and concepts episode by episode.", patent_direction: "Continuous podcast knowledge extraction subscription service" },
  { source_number: 15, category: "CAPTURE", title: "Website Snapshot Vault", description: "Save any webpage with AI summary, semantic tags, and visual snapshot — owned by you, not a third party.", patent_direction: "Self-hosted web archiving with AI semantic annotation layer" },
  { source_number: 16, category: "CAPTURE", title: "Spreadsheet Story Extractor", description: "Upload any spreadsheet and AI extracts the narrative, trends, and insights as readable documents.", patent_direction: "Tabular data narrative extraction with trend story generation" },
  { source_number: 17, category: "CAPTURE", title: "Presentation DNA Extractor", description: "Upload any PowerPoint/slides and extract the core ideas, structure, and talking points as editable outlines.", patent_direction: "Slide-to-outline semantic structure extraction protocol" },
  { source_number: 18, category: "CAPTURE", title: "Image Context Vault", description: "Upload photos and AI extracts text, objects, people (with consent), locations, and links to relevant projects.", patent_direction: "Multi-modal image context extraction with project routing" },
  { source_number: 19, category: "CAPTURE", title: "Calendar Context Engine", description: "AI reads calendar events to understand your timeline, deadlines, and goals and surfaces relevant content proactively.", patent_direction: "Calendar-aware proactive knowledge surface system" },
  { source_number: 20, category: "CAPTURE", title: "Jenni/Notion/Obsidian Bridge", description: "Universal connector for writing/PKM tools — imports notes, documents, databases in real time.", patent_direction: "PKM-agnostic bidirectional sync protocol with conflict resolution" },
  // GENERATE (21-40)
  { source_number: 21, category: "GENERATE", title: "Any-to-Any Content Transformer", description: "The core Genesis Engine: feed any content in any format, specify output format, get perfect output.", patent_direction: "Format-agnostic AI content transformation with fidelity scoring" },
  { source_number: 22, category: "GENERATE", title: "Transmedia Bible Generator", description: "From one core idea, auto-generate a complete transmedia universe: book, podcast, video, game, course.", patent_direction: "Transmedia universe expansion engine with cross-format consistency" },
  { source_number: 23, category: "GENERATE", title: "Personalized Audiobook Creator", description: "Turn any document collection into a narrated audiobook with chapter breaks and custom voice.", patent_direction: "Personal knowledge audiobook synthesis with dynamic narration" },
  { source_number: 24, category: "GENERATE", title: "Auto-Documentary Creator", description: "Feed research + notes → AI assembles a narrated video documentary with stock visuals.", patent_direction: "AI documentary assembly pipeline from unstructured research" },
  { source_number: 25, category: "GENERATE", title: "Interactive Course Builder", description: "Upload any expertise source → AI creates full course with modules, quizzes, exercises, certificates.", patent_direction: "Expertise-to-curriculum automated instructional design system" },
  { source_number: 26, category: "GENERATE", title: "Personal Brand Amplifier", description: "Takes your ideas and auto-creates a week of social content, email newsletter, and blog posts.", patent_direction: "Unified personal brand content multiplication engine" },
  { source_number: 27, category: "GENERATE", title: "Patent Draft Generator", description: "Describe your invention in plain language → AI generates provisional patent draft with claims.", patent_direction: "Natural language to patent claim structure generator" },
  { source_number: 28, category: "GENERATE", title: "Business Plan Auto-Writer", description: "Feed your notes, ideas, market research → AI writes a full investor-ready business plan.", patent_direction: "Contextual business plan synthesis from unstructured founder notes" },
  { source_number: 29, category: "GENERATE", title: "Game Narrative Engine", description: "Turn any IP or story into an interactive text/visual game with branching narrative.", patent_direction: "IP-to-interactive-narrative conversion engine with branching logic" },
  { source_number: 30, category: "GENERATE", title: "Podcast Season Generator", description: "From a topic and notes, generate a full podcast season: episode outlines, scripts, show notes.", patent_direction: "Long-form podcast season planning and scripting AI system" },
  { source_number: 31, category: "GENERATE", title: "Mind Map Exploder", description: "Type one idea → AI generates a fully populated mind map with 5 levels of sub-concepts.", patent_direction: "Recursive concept expansion mind map generation algorithm" },
  { source_number: 32, category: "GENERATE", title: "Research-to-Report Pipeline", description: "Paste URLs, PDFs, notes → AI generates a formatted research report with citations.", patent_direction: "Multi-source research synthesis with automated citation mapping" },
  { source_number: 33, category: "GENERATE", title: "Website Clone-to-Customize", description: "Describe a website you like → AI generates a fully customized version for your brand.", patent_direction: "Inspiration-based website generation with brand personalization" },
  { source_number: 34, category: "GENERATE", title: "Legal Agreement Drafts", description: "Describe a business deal in plain English → AI generates first draft of relevant agreements.", patent_direction: "Natural language to legal instrument first-draft generation system" },
  { source_number: 35, category: "GENERATE", title: "Children's Book Creator", description: "Any story idea → illustrated children's book with AI-generated text + imagery suggestions.", patent_direction: "Narrative-to-children's-book formatting and illustration pipeline" },
  { source_number: 36, category: "GENERATE", title: "Academic Paper Formatter", description: "Upload research notes → AI formats into a proper academic paper with abstract, citations, sections.", patent_direction: "Academic paper synthesis with style-guide compliance engine" },
  { source_number: 37, category: "GENERATE", title: "Investor Deck Assembler", description: "From any business notes, generate a polished pitch deck with story arc and financial slides.", patent_direction: "Investor narrative pitch deck assembly from unstructured business context" },
  { source_number: 38, category: "GENERATE", title: "Song Lyric & Melody Suggester", description: "Describe a feeling, theme, or topic → AI generates song lyrics with suggested chord progressions.", patent_direction: "Theme-to-song composition assistant with emotional mapping" },
  { source_number: 39, category: "GENERATE", title: "Spreadsheet Formula Builder", description: "Describe what you want a spreadsheet to do in English → AI builds it with formulas.", patent_direction: "Natural language spreadsheet formula and structure generation" },
  { source_number: 40, category: "GENERATE", title: "Movie Pitch Generator", description: "From any IP, story, or concept → full movie pitch with logline, synopsis, character sheets.", patent_direction: "IP-to-film pitch synthesis with genre and market analysis" },
  // PRIVACY (41-60)
  { source_number: 41, category: "PRIVACY", title: "Zero-Knowledge Vault", description: "All user data encrypted locally before syncing — server never sees plaintext. User holds the only key.", patent_direction: "Client-side encryption with user-sovereign key management for AI systems" },
  { source_number: 42, category: "PRIVACY", title: "Data Dividend System", description: "When users choose to share data with AI training, they receive micropayments or platform credits.", patent_direction: "User data monetization with opt-in consent and compensation protocol" },
  { source_number: 43, category: "PRIVACY", title: "Consent Firewall Layer", description: "Every data connection requires explicit per-source consent that can be revoked at any time.", patent_direction: "Granular per-source consent management with instant revocation" },
  { source_number: 44, category: "PRIVACY", title: "Personal AI That Forgets", description: "Users can set expiration dates on any data — after which even the system cannot access it.", patent_direction: "Temporal data expiration with cryptographic deletion verification" },
  { source_number: 45, category: "PRIVACY", title: "Shadow Profile Detector", description: "AI scans for places where your data has been collected without your knowledge and alerts you.", patent_direction: "Cross-platform shadow profile detection and user notification system" },
  { source_number: 46, category: "PRIVACY", title: "Local-Only Processing Mode", description: "Run AI models entirely on-device — no data ever leaves the user's hardware.", patent_direction: "On-device AI inference pipeline with zero network data transmission" },
  { source_number: 47, category: "PRIVACY", title: "Federated Personal AI", description: "Your AI model trains only on your data, on your device, and stays yours.", patent_direction: "Federated personal AI training with on-device model ownership" },
  { source_number: 48, category: "PRIVACY", title: "AI Audit Trail", description: "Every AI operation on your data creates a transparent, auditable log that only you can see.", patent_direction: "User-sovereign AI operation audit log with tamper-proof storage" },
  { source_number: 49, category: "PRIVACY", title: "Anti-Scrape Shield", description: "System detects and blocks unauthorized attempts to scrape or exfiltrate user content.", patent_direction: "Real-time unauthorized content exfiltration detection and blocking" },
  { source_number: 50, category: "PRIVACY", title: "Decentralized Identity Layer", description: "Users control their identity across all connected platforms without centralized auth.", patent_direction: "Decentralized identity management for AI platform federation" },
  { source_number: 51, category: "PRIVACY", title: "Terms-of-Service AI Analyzer", description: "Before connecting any tool, AI explains in plain language exactly what data access you're granting.", patent_direction: "Natural language TOS risk scoring with visual consent interface" },
  { source_number: 52, category: "PRIVACY", title: "Pseudonymization Engine", description: "Automatically replaces personally identifiable information before any data is processed by AI.", patent_direction: "Real-time PII pseudonymization for AI processing pipelines" },
  { source_number: 53, category: "PRIVACY", title: "Right-to-Erasure Enforcer", description: "One-click deletion that propagates to all connected systems and verifies deletion.", patent_direction: "Cross-platform right-to-erasure enforcement with deletion verification" },
  { source_number: 54, category: "PRIVACY", title: "Surveillance Capitalism Blocker", description: "Detects and blocks advertising trackers that attempt to profile users through AI platforms.", patent_direction: "AI platform ad-tracking detection and neutralization system" },
  { source_number: 55, category: "PRIVACY", title: "Open Source AI Core", description: "Core AI models are open source so users can verify they're not being manipulated.", patent_direction: "Open-source AI core with proprietary privacy enhancement layer" },
  { source_number: 56, category: "PRIVACY", title: "Data Portability Passport", description: "Export ALL your data from any platform in any format with one click.", patent_direction: "Universal data portability passport with cross-platform export" },
  { source_number: 57, category: "PRIVACY", title: "AI Bias Detector", description: "Analyzes AI outputs for political, commercial, or ideological bias and flags it to the user.", patent_direction: "Real-time AI output bias detection and flagging system" },
  { source_number: 58, category: "PRIVACY", title: "Corporate Watchdog Mode", description: "Monitors AI platforms you use for policy changes that affect your data rights and alerts you.", patent_direction: "AI platform policy change monitoring and user rights alert system" },
  { source_number: 59, category: "PRIVACY", title: "Encrypted Collaboration Layer", description: "Share content with collaborators without ever exposing raw data to the platform.", patent_direction: "End-to-end encrypted collaborative AI workspace protocol" },
  { source_number: 60, category: "PRIVACY", title: "People's AI Cooperative", description: "Users collectively own the AI model — governance, revenue, and direction decided by members.", patent_direction: "Cooperative AI ownership structure with DAO governance integration" },
  // CONNECT (61-80)
  { source_number: 61, category: "CONNECT", title: "Natural Language Connector", description: "Connect any new tool just by describing it: 'Connect my Notion workspace' — AI handles auth and setup.", patent_direction: "NLP-driven API connector bootstrapping with zero-code configuration" },
  { source_number: 62, category: "CONNECT", title: "Universal Webhook Intelligence", description: "Any app that supports webhooks can send data to Genesis Engine for processing.", patent_direction: "Universal webhook-to-AI-pipeline routing with semantic classification" },
  { source_number: 63, category: "CONNECT", title: "Browser-as-Source", description: "Any website you visit can be captured as a source with one click, regardless of whether it has an API.", patent_direction: "Consent-gated browser-level content capture without API dependency" },
  { source_number: 64, category: "CONNECT", title: "IFTTT/Zapier Replacement", description: "Build any automation with natural language: 'When I get an email about X, add to my Y project.'", patent_direction: "Natural language automation rule engine with AI trigger classification" },
  { source_number: 65, category: "CONNECT", title: "Phone as Universal Remote", description: "Capture anything from your phone: photo, voice, screen — routes to the right project automatically.", patent_direction: "Mobile-to-project intelligent routing with context-aware classification" },
  { source_number: 66, category: "CONNECT", title: "API Reverse Engineer", description: "Point the system at any website; AI figures out the API structure and builds a connector.", patent_direction: "Automated API discovery and connector synthesis from website analysis" },
  { source_number: 67, category: "CONNECT", title: "File System Watcher", description: "Watch any folder on your computer — new files are auto-indexed and classified.", patent_direction: "Intelligent local filesystem monitoring with AI-powered auto-indexing" },
  { source_number: 68, category: "CONNECT", title: "Cloud Storage Unifier", description: "Connect Google Drive, Dropbox, OneDrive, iCloud — search all from one place.", patent_direction: "Multi-cloud storage federation with unified semantic search layer" },
  { source_number: 69, category: "CONNECT", title: "Smart QR Capture", description: "Print QR codes that, when scanned, automatically add content to a specific project.", patent_direction: "QR-code-triggered content routing to AI knowledge vault" },
  { source_number: 70, category: "CONNECT", title: "Wearable Context Feed", description: "Apple Watch / Fitbit can capture voice notes, location context, and activity data.", patent_direction: "Wearable device context streaming with AI knowledge enrichment" },
  { source_number: 71, category: "CONNECT", title: "TV/Streaming Capture", description: "Note a movie, show, or documentary you're watching; AI adds context about it to your vault.", patent_direction: "Streaming content identifier with automated knowledge vault enrichment" },
  { source_number: 72, category: "CONNECT", title: "Physical-to-Digital Bridge", description: "Scan any physical document, receipt, whiteboard, sticky note — AI parses and files it.", patent_direction: "Physical document AI extraction with contextual digital filing" },
  { source_number: 73, category: "CONNECT", title: "Social Graph Importer", description: "Understand your network — import connections, their interests, and collaboration potential.", patent_direction: "Privacy-preserving social graph analysis for opportunity discovery" },
  { source_number: 74, category: "CONNECT", title: "Public Data Harvester", description: "Pull in public datasets, government data, research papers relevant to your projects.", patent_direction: "Contextual public data discovery and relevance-ranking for personal projects" },
  { source_number: 75, category: "CONNECT", title: "RSS Intelligence Feed", description: "Subscribe to any RSS feed; AI filters and delivers only what's relevant to your current projects.", patent_direction: "Project-aware RSS filtering with semantic relevance scoring" },
  { source_number: 76, category: "CONNECT", title: "WordPress/Ghost Publisher Bridge", description: "Create content in Genesis Engine and publish directly to your blog with formatting.", patent_direction: "AI content system to CMS publishing bridge with format translation" },
  { source_number: 77, category: "CONNECT", title: "SMS/WhatsApp Capture", description: "Text a number to add a quick note or idea to your vault from anywhere.", patent_direction: "SMS/messaging-as-input for AI knowledge vault with NLP classification" },
  { source_number: 78, category: "CONNECT", title: "Code Comment Extractor", description: "Extract and index all comments, documentation, and TODOs from codebases as knowledge.", patent_direction: "Source code annotation extraction and knowledge base integration" },
  { source_number: 79, category: "CONNECT", title: "Event Capture Widget", description: "One embed code that can be added to any website to capture leads, feedback, or content.", patent_direction: "Universal embeddable content capture widget with AI routing" },
  { source_number: 80, category: "CONNECT", title: "Marketplace of Connectors", description: "Community-built connectors for any platform — users can sell/share their integrations.", patent_direction: "Decentralized connector marketplace with revenue sharing protocol" },
  // PATENT (81-100)
  { source_number: 81, category: "PATENT", title: "Intent Graph Engine", description: "AI that learns the user's long-term goals and surfaces content/actions proactively based on intent.", patent_direction: "Long-term user intent modeling with proactive knowledge surfacing" },
  { source_number: 82, category: "PATENT", title: "Serendipity Engine", description: "Randomly surfaces forgotten or unconnected knowledge pieces that might spark new ideas.", patent_direction: "Stochastic knowledge resurrection for creative serendipity generation" },
  { source_number: 83, category: "PATENT", title: "Idea Collision Detector", description: "Finds when two of your separate ideas could be combined into something more powerful.", patent_direction: "Cross-project concept collision detection with opportunity scoring" },
  { source_number: 84, category: "PATENT", title: "Expertise Fingerprint", description: "AI builds a map of what you uniquely know that most people don't — your expertise fingerprint.", patent_direction: "Unique expertise domain mapping through knowledge vault analysis" },
  { source_number: 85, category: "PATENT", title: "Content Age Detector", description: "Flags any content in your vault that is outdated and suggests what needs updating.", patent_direction: "Knowledge freshness scoring with proactive update recommendation" },
  { source_number: 86, category: "PATENT", title: "Gap Analysis Engine", description: "Analyzes your knowledge on a topic and tells you exactly what you're missing to achieve a goal.", patent_direction: "Knowledge gap identification relative to goal-achievement requirements" },
  { source_number: 87, category: "PATENT", title: "Competitor Intelligence Moat", description: "Monitors competitors' public output and surfaces when they move into your IP territory.", patent_direction: "Public competitor activity monitoring with IP territory alert system" },
  { source_number: 88, category: "PATENT", title: "Proof-of-Creation Blockchain", description: "Every piece of content created gets a blockchain timestamp proving you created it first.", patent_direction: "Decentralized proof-of-creation registry for digital intellectual property" },
  { source_number: 89, category: "PATENT", title: "AI Ghostwriter with Voice", description: "AI learns your exact writing voice from samples and writes in your voice across all formats.", patent_direction: "Personal writing voice modeling and cross-format content generation" },
  { source_number: 90, category: "PATENT", title: "Context Window Memory", description: "AI maintains long-term context across sessions using your vault — remembers everything you told it.", patent_direction: "Persistent cross-session AI context maintenance using personal knowledge vault" },
  { source_number: 91, category: "PATENT", title: "Collaborative AI Co-Pilot", description: "Multiple users can work in a shared AI workspace where the AI serves all of them simultaneously.", patent_direction: "Multi-user shared AI workspace with individualized context management" },
  { source_number: 92, category: "PATENT", title: "Skill Stacking Recommender", description: "Analyzes your goals and existing skills, recommends the exact next skill to learn for maximum leverage.", patent_direction: "Goal-relative skill gap analysis with learning path optimization" },
  { source_number: 93, category: "PATENT", title: "Revenue Path Generator", description: "AI analyzes your knowledge vault and suggests specific monetization paths for your expertise.", patent_direction: "Expertise monetization path discovery engine with market fit scoring" },
  { source_number: 94, category: "PATENT", title: "Anti-Plagiarism Creator Shield", description: "Before publishing anything, AI checks if content is too similar to existing published work.", patent_direction: "Pre-publication originality verification system with similarity scoring" },
  { source_number: 95, category: "PATENT", title: "Dynamic NDA Generator", description: "Before sharing any content externally, auto-generate a custom NDA scoped to that content.", patent_direction: "Content-aware dynamic NDA generation with scope limiting" },
  { source_number: 96, category: "PATENT", title: "People's Patent Pool", description: "Community of independent inventors shares defensive patents to block corporate IP theft.", patent_direction: "Cooperative defensive patent pool protocol for independent inventors" },
  { source_number: 97, category: "PATENT", title: "AI Output Watermarker", description: "Every piece of AI-generated content gets an invisible watermark proving your system created it.", patent_direction: "Invisible watermarking for AI-generated content with proof-of-origin" },
  { source_number: 98, category: "PATENT", title: "Trillion Dollar Idea Scorer", description: "AI analyzes your ideas against market size, timing, competition, and your unique position to score potential.", patent_direction: "Multi-variable idea potential scoring with personal leverage analysis" },
  { source_number: 99, category: "PATENT", title: "Legacy Vault", description: "Time-locked content vault — release your knowledge, books, IP on a schedule you set, even posthumously.", patent_direction: "Time-locked digital legacy content release system with posthumous scheduling" },
  { source_number: 100, category: "PATENT", title: "The People's OS for AI", description: "An open operating system layer that sits between users and any AI — giving users full control, visibility, and ownership of every interaction.", patent_direction: "User-sovereign AI interaction operating system with transparency and control layer" },
];

// ─── MINDMAP NODES ─────────────────────────────────────────────

export const SEED_MINDMAP_NODES: Array<{
  source_key: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  parent_source_key: string | null;
  text_color: string;
  sort_order: number;
}> = [
  { source_key: "root", label: "GENESIS\nCOMMAND", x: 500, y: 340, radius: 52, color: "#00f5c4", parent_source_key: null, text_color: "#000", sort_order: 0 },
  { source_key: "n1", label: "CAPTURE", x: 240, y: 160, radius: 38, color: "#00f5c4", parent_source_key: "root", text_color: "#000", sort_order: 1 },
  { source_key: "n2", label: "GENERATE", x: 760, y: 160, radius: 38, color: "#ff6b35", parent_source_key: "root", text_color: "#fff", sort_order: 2 },
  { source_key: "n3", label: "PRIVACY", x: 180, y: 400, radius: 38, color: "#a855f7", parent_source_key: "root", text_color: "#fff", sort_order: 3 },
  { source_key: "n4", label: "CONNECT", x: 820, y: 400, radius: 38, color: "#3b82f6", parent_source_key: "root", text_color: "#fff", sort_order: 4 },
  { source_key: "n5", label: "PATENTS", x: 500, y: 590, radius: 38, color: "#facc15", parent_source_key: "root", text_color: "#000", sort_order: 5 },
  { source_key: "n6", label: "4 APPS →\n1 SUPER APP", x: 300, y: 590, radius: 32, color: "#ec4899", parent_source_key: "root", text_color: "#fff", sort_order: 6 },
  { source_key: "n7", label: "BETA\nLAUNCH", x: 700, y: 590, radius: 32, color: "#ec4899", parent_source_key: "root", text_color: "#fff", sort_order: 7 },
  // Capture children
  { source_key: "c1", label: "Drive\nSync", x: 110, y: 80, radius: 24, color: "#00f5c4aa", parent_source_key: "n1", text_color: "#000", sort_order: 1 },
  { source_key: "c2", label: "YouTube\nMiner", x: 210, y: 40, radius: 24, color: "#00f5c4aa", parent_source_key: "n1", text_color: "#000", sort_order: 2 },
  { source_key: "c3", label: "Chat\nImport", x: 320, y: 55, radius: 24, color: "#00f5c4aa", parent_source_key: "n1", text_color: "#000", sort_order: 3 },
  { source_key: "c4", label: "Email\nExtract", x: 130, y: 200, radius: 24, color: "#00f5c4aa", parent_source_key: "n1", text_color: "#000", sort_order: 4 },
  // Generate children
  { source_key: "g1", label: "Video\nDocs", x: 870, y: 70, radius: 24, color: "#ff6b3580", parent_source_key: "n2", text_color: "#fff", sort_order: 1 },
  { source_key: "g2", label: "Podcast\nGen", x: 760, y: 40, radius: 24, color: "#ff6b3580", parent_source_key: "n2", text_color: "#fff", sort_order: 2 },
  { source_key: "g3", label: "Book\nWriter", x: 650, y: 70, radius: 24, color: "#ff6b3580", parent_source_key: "n2", text_color: "#fff", sort_order: 3 },
  { source_key: "g4", label: "Slide\nMaker", x: 870, y: 200, radius: 24, color: "#ff6b3580", parent_source_key: "n2", text_color: "#fff", sort_order: 4 },
  // Privacy children
  { source_key: "p1c", label: "Zero\nKnow", x: 60, y: 310, radius: 22, color: "#a855f780", parent_source_key: "n3", text_color: "#fff", sort_order: 1 },
  { source_key: "p2c", label: "Local\nFirst", x: 60, y: 430, radius: 22, color: "#a855f780", parent_source_key: "n3", text_color: "#fff", sort_order: 2 },
  { source_key: "p3c", label: "Consent\nLayer", x: 140, y: 510, radius: 22, color: "#a855f780", parent_source_key: "n3", text_color: "#fff", sort_order: 3 },
  // Connect children
  { source_key: "co1", label: "NLP\nConnect", x: 940, y: 310, radius: 22, color: "#3b82f680", parent_source_key: "n4", text_color: "#fff", sort_order: 1 },
  { source_key: "co2", label: "Webhook\nHub", x: 940, y: 430, radius: 22, color: "#3b82f680", parent_source_key: "n4", text_color: "#fff", sort_order: 2 },
  { source_key: "co3", label: "Mobile\nCapture", x: 860, y: 510, radius: 22, color: "#3b82f680", parent_source_key: "n4", text_color: "#fff", sort_order: 3 },
  // Patent children
  { source_key: "pt1", label: "Proof\nof Creation", x: 390, y: 660, radius: 22, color: "#facc1580", parent_source_key: "n5", text_color: "#000", sort_order: 1 },
  { source_key: "pt2", label: "People's\nPatent Pool", x: 500, y: 680, radius: 22, color: "#facc1580", parent_source_key: "n5", text_color: "#000", sort_order: 2 },
  { source_key: "pt3", label: "IP\nMonitor", x: 610, y: 660, radius: 22, color: "#facc1580", parent_source_key: "n5", text_color: "#000", sort_order: 3 },
];

// ─── MOAT SECTIONS ─────────────────────────────────────────────

export const SEED_MOAT_SECTIONS: Array<{
  slug: string;
  icon: string;
  title: string;
  color: string;
  sort_order: number;
  items: string[];
}> = [
  {
    slug: "provisional-patents",
    icon: "⚡",
    title: "PROVISIONAL PATENTS — FILE FIRST",
    color: "#00f5c4",
    sort_order: 1,
    items: [
      "Genesis Engine universal ingestion system",
      "TransMedia Engine format-agnostic transformer",
      "Privacy firewall with user-sovereign data controls",
      "Local-first encrypted AI processing pipeline",
      "Intent Graph Engine proactive surfacing system",
    ],
  },
  {
    slug: "trade-secrets",
    icon: "🔐",
    title: "TRADE SECRETS — PROTECT INTERNALLY",
    color: "#ff6b35",
    sort_order: 2,
    items: [
      "Proprietary AI model fine-tuning data",
      "Custom ranking and relevance algorithms",
      "Business logic for transmedia content generation",
      "Pricing and monetization strategy details",
      "Partnership and licensing deal terms",
    ],
  },
  {
    slug: "copyrights",
    icon: "©️",
    title: "COPYRIGHTS — REGISTER ALL CREATIVE WORKS",
    color: "#a855f7",
    sort_order: 3,
    items: [
      "All source code across all 4 apps",
      "Genesis Command Center UI design",
      "100-idea library content",
      "Book manuscripts and transmedia content",
      "All marketing copy, documentation, training materials",
    ],
  },
  {
    slug: "trademarks",
    icon: "™️",
    title: "TRADEMARKS — REGISTER BRAND ASSETS",
    color: "#facc15",
    sort_order: 4,
    items: [
      "Genesis Engine™",
      "TransMedia Engine™",
      "Genesis Command Center™",
      "The People's AI™",
      "Content DNA™ (if applicable)",
      "Your app names and brand names",
      "Any unique terminology you coin",
      "Slogans and taglines",
    ],
  },
  {
    slug: "defensive-publications",
    icon: "🔒",
    title: "DEFENSIVE PUBLICATIONS — BLOCK OTHERS",
    color: "#3b82f6",
    sort_order: 5,
    items: [
      "Publish the 100 ideas as timestamped prior art",
      "Post technical blogs describing novel methods",
      "File defensive disclosures with IP.com",
      "Submit to GitHub with clear timestamps",
      "Notarize key documents with blockchain",
      "Post on arXiv if technical enough",
      "Create YouTube walkthroughs (prior art)",
      "Send certified letter to yourself (backup)",
    ],
  },
  {
    slug: "competitive-moat",
    icon: "⚔️",
    title: "COMPETITIVE MOAT — MAKE IT HARD TO COPY",
    color: "#ec4899",
    sort_order: 6,
    items: [
      "Network effects: more users = better AI",
      "Data flywheel: usage improves the system",
      "Ecosystem lock-in via integrations",
      "Brand trust as the privacy-first AI",
      "Community & cooperative ownership model",
      "First-mover advantage in people-owned AI",
      "Open-source core, proprietary services",
      "Deep domain expertise in transmedia",
    ],
  },
];

export const SEED_IP_TIMELINE: Array<{
  time_label: string;
  action: string;
  color: string;
  sort_order: number;
}> = [
  { time_label: "TODAY", action: "Document everything with timestamps. Screenshot, commit to GitHub, send email to yourself.", color: "#ff4444", sort_order: 1 },
  { time_label: "WEEK 1", action: "File provisional patent applications for Genesis Engine + TransMedia Engine core innovations.", color: "#ff6b35", sort_order: 2 },
  { time_label: "WEEK 1", action: "Publish defensive disclosure for the 100 ideas to establish prior art.", color: "#ff6b35", sort_order: 3 },
  { time_label: "WEEK 2", action: "Consult IP attorney for freedom-to-operate analysis on core technology.", color: "#facc15", sort_order: 4 },
  { time_label: "WEEK 2", action: "File copyright registrations for all existing code, writing, and media.", color: "#facc15", sort_order: 5 },
  { time_label: "MONTH 1", action: "File trademark applications for primary brand names and product names.", color: "#00f5c4", sort_order: 6 },
  { time_label: "MONTH 3", action: "File utility patents (full) for the 3–5 most novel and defensible innovations.", color: "#3b82f6", sort_order: 7 },
  { time_label: "MONTH 6", action: "Re-evaluate IP landscape, file continuation patents as product evolves.", color: "#a855f7", sort_order: 8 },
];
