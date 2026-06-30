#!/usr/bin/env bash
# ================================================================
# ATLAS v66 — One-Click Deploy Script
# Reads .env.local, validates, builds, pushes to Vercel.
# Run from inside atlas-build/: bash deploy.sh
# Isaac Brandon Burdette · Atlas Genesis Matrix LLC
# ================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────
RED='\033[0;31m'; YLW='\033[1;33m'; GRN='\033[0;32m'; CYN='\033[0;36m'; PUR='\033[0;35m'; NC='\033[0m'

banner() { echo -e "\n${PUR}⬡ ATLAS GENESIS MATRIX · v66 DEPLOY${NC}"; echo -e "${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }
step()   { echo -e "${CYN}[$1]${NC} $2"; }
ok()     { echo -e "${GRN}  ✓${NC} $1"; }
warn()   { echo -e "${YLW}  ⚠${NC} $1"; }
fail()   { echo -e "${RED}  ✗ FATAL:${NC} $1"; exit 1; }

banner

# ── Step 1: Verify we're in the right directory ───────────────────
step "1/7" "Checking project structure…"
[[ -f "package.json" ]]  || fail "Not in atlas-build/ directory. cd into atlas-build/ first."
[[ -f "next.config.js" ]] || fail "next.config.js not found. Wrong directory?"
ok "Project root confirmed"

# ── Step 2: Check .env.local ──────────────────────────────────────
step "2/7" "Validating .env.local…"
[[ -f ".env.local" ]] || fail ".env.local not found. Copy .env.example and fill in values."

MISSING=()

check_env() {
  local key=$1
  local val
  val=$(grep "^${key}=" .env.local 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [[ -z "$val" || "$val" == *"PASTE_"* || "$val" == *"your-"* || "$val" == *"sk-ant-..."* ]]; then
    MISSING+=("$key")
  fi
}

# Required keys
check_env "NEXT_PUBLIC_SUPABASE_URL"
check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env "SUPABASE_SERVICE_ROLE_KEY"
check_env "ANTHROPIC_API_KEY"

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo -e "\n${RED}  ✗ Missing or placeholder env vars:${NC}"
  for key in "${MISSING[@]}"; do
    echo -e "    ${YLW}→ $key${NC}"
  done
  echo -e "\n  Edit .env.local and fill in these values, then re-run.\n"
  echo -e "  ${CYN}Supabase keys:${NC} https://supabase.com/dashboard/project/kjfwanpwzgcscgsdgekm/settings/api"
  echo -e "  ${CYN}Anthropic key:${NC} https://console.anthropic.com/settings/keys\n"
  exit 1
fi

ok "All required env vars present"

# Warn on leaked key pattern (starts with old prefix patterns)
ANTH_KEY=$(grep "^ANTHROPIC_API_KEY=" .env.local | cut -d'=' -f2-)
if [[ "$ANTH_KEY" == "sk-ant-api03"* ]]; then
  warn "This looks like the OLD leaked key pattern (sk-ant-api03-*). Rotate it first!"
  warn "Go to console.anthropic.com → API Keys → delete old → create new"
  read -p "  Type 'continue' to proceed anyway, or Ctrl+C to abort: " CONFIRM
  [[ "$CONFIRM" == "continue" ]] || exit 1
fi

# ── Step 3: Check Node + npm ──────────────────────────────────────
step "3/7" "Checking Node.js environment…"
NODE_VER=$(node --version 2>/dev/null || echo "none")
if [[ "$NODE_VER" == "none" ]]; then
  fail "Node.js not found. Install from https://nodejs.org (v18+ required)"
fi
ok "Node $NODE_VER"

# ── Step 4: Install dependencies ──────────────────────────────────
step "4/7" "Installing dependencies…"
if [[ ! -d "node_modules" ]]; then
  echo "  Running npm install…"
  npm install --silent || fail "npm install failed"
  ok "Dependencies installed"
else
  ok "node_modules already present (skipping install)"
fi

# ── Step 5: Type check + build ────────────────────────────────────
step "5/7" "Building (npm run build)…"
echo "  This takes 30-90 seconds…"
if ! npm run build 2>&1 | tail -20; then
  fail "Build failed. Fix TypeScript/lint errors above and re-run."
fi
ok "Build passed ✓"

# ── Step 6: Check Vercel CLI ──────────────────────────────────────
step "6/7" "Checking Vercel CLI…"
if ! command -v vercel &>/dev/null; then
  echo -e "  ${YLW}Vercel CLI not found. Installing globally…${NC}"
  npm install -g vercel || fail "Could not install Vercel CLI"
fi
ok "Vercel CLI ready ($(vercel --version 2>/dev/null | head -1))"

# ── Step 7: Deploy ────────────────────────────────────────────────
step "7/7" "Deploying to Vercel…"
echo ""
echo -e "  ${YLW}IMPORTANT:${NC} When Vercel asks:"
echo -e "  • Set up and deploy? → ${GRN}Y${NC}"
echo -e "  • Which scope/team?  → ${GRN}Isaac's personal account (NOT Nas's team)${NC}"
echo -e "  • Link to existing?  → ${GRN}N${NC} (first time) or ${GRN}Y${NC} (re-deploy)"
echo -e "  • Project name?      → ${GRN}atlas-genesis-matrix${NC}"
echo ""

# Detect if --prod flag was passed
PROD_FLAG=""
if [[ "${1:-}" == "--prod" ]]; then
  PROD_FLAG="--prod"
  echo -e "  ${YLW}Deploying to PRODUCTION (--prod flag set)${NC}"
else
  echo -e "  Deploying to ${CYN}preview URL${NC} (add --prod for production)"
fi

# Pull env vars from .env.local and set them in Vercel
echo -e "\n  ${CYN}Syncing env vars to Vercel…${NC}"
while IFS= read -r line; do
  # Skip comments and empty lines
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  KEY="${line%%=*}"
  VAL="${line#*=}"
  # Skip empty values
  [[ -z "$VAL" || "$VAL" == "PASTE_"* ]] && continue
  vercel env add "$KEY" production <<< "$VAL" 2>/dev/null || true
done < .env.local

echo ""
vercel $PROD_FLAG

echo ""
echo -e "${GRN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GRN}⬡ ATLAS v66 DEPLOYED${NC}"
echo -e "${GRN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYN}Next steps:${NC}"
echo -e "  1. Open the preview URL above"
echo -e "  2. Check /admin/system-health — all green?"
echo -e "  3. Open /admin/agent-tasks — seed your build backlog:"
echo -e "     ${YLW}npx tsx scripts/seed-agent-tasks.ts${NC}"
echo -e "  4. Test AI: open Agent Lab → run A01-ORACLE"
echo -e "  5. For PRODUCTION deploy: ${YLW}bash deploy.sh --prod${NC}"
echo ""
