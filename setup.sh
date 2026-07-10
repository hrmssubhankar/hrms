#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  YAHWEH HRMS — One-shot local setup script
#  Run from the project root: bash setup.sh
#  macOS only (uses Homebrew)
# ─────────────────────────────────────────────────────────────────────────────
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Yahweh HRMS — Environment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Homebrew ───────────────────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  ok "Homebrew already installed"
fi

# ── 2. VS Code ────────────────────────────────────────────────────────────────
if ! command -v code &>/dev/null; then
  info "Installing Visual Studio Code..."
  brew install --cask visual-studio-code
  ok "VS Code installed"
else
  ok "VS Code already installed ($(code --version | head -1))"
fi

# ── 3. Node.js ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  info "Installing Node.js via Homebrew..."
  brew install node@20
  brew link --overwrite node@20
else
  ok "Node.js already installed ($(node --version))"
fi

# ── 4. .NET 8 SDK ─────────────────────────────────────────────────────────────
if ! command -v dotnet &>/dev/null; then
  info "Installing .NET 8 SDK..."
  brew install --cask dotnet-sdk
else
  DOTNET_VER=$(dotnet --version 2>/dev/null || echo "unknown")
  ok ".NET already installed ($DOTNET_VER)"
fi

# ── 5. PostgreSQL client (psql) ───────────────────────────────────────────────
if ! command -v psql &>/dev/null; then
  info "Installing PostgreSQL client (psql)..."
  brew install libpq
  brew link --force libpq
else
  ok "psql already installed ($(psql --version))"
fi

# ── 6. Git ────────────────────────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
  info "Installing Git..."
  brew install git
fi

git config --global user.name  "Subhankar Mondal"
git config --global user.email "mondalsubhankar@outlook.com"
ok "Git configured ($(git --version))"

# ── 7. npm install ────────────────────────────────────────────────────────────
info "Installing Node.js dependencies..."
npm install
ok "npm packages installed"

# ── 8. Git init & push ────────────────────────────────────────────────────────
info "Setting up Git repository..."
git init 2>/dev/null || true
git checkout -b main 2>/dev/null || git checkout main 2>/dev/null || true

# Add remote (idempotent)
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/hrmssubhankar/hrms.git

git add -A
git commit -m "feat: initial Yahweh HRMS scaffold

- Next.js 14 TypeScript frontend (Vercel-ready)
- .NET 8 ASP.NET Core Web API backend (3-layer architecture)
- Drizzle ORM + full PostgreSQL schema for all 28 HRMS modules
- Multi-tenant RLS isolation at database level
- Custom JWT + TOTP 2FA authentication
- SignalR real-time notifications hub
- Hangfire background job scheduler
- QuestPDF + ClosedXML for reports
- GitHub Actions CI/CD workflow" 2>/dev/null || warn "Nothing new to commit"

info "Pushing to GitHub..."
echo ""
warn "You will be prompted for your GitHub username + Personal Access Token (PAT)."
warn "Create one at: https://github.com/settings/tokens (needs 'repo' scope)"
echo ""
git push -u origin main

ok "Code pushed to https://github.com/hrmssubhankar/hrms"

# ── 9. Database schema ────────────────────────────────────────────────────────
echo ""
info "Applying database schema to Neon PostgreSQL..."
psql "postgresql://neondb_owner:npg_GbCE3xsd5Teq@ep-little-cake-ahfjtrj2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" \
  -f database/migrations/001_initial_schema.sql
ok "Database schema applied"

# ── 10. Open VS Code ──────────────────────────────────────────────────────────
info "Opening project in VS Code..."
code .

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}  ✅  Setup complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Next steps:"
echo "  1. Run the frontend:  npm run dev  → http://localhost:3000"
echo "  2. Run the backend:   cd api && dotnet run --project YahwehHrms.API"
echo "  3. Deploy to Vercel:  npx vercel  (first time) or push to main"
echo "  4. Drizzle Studio:    npm run db:studio"
echo ""
echo "  GitHub:  https://github.com/hrmssubhankar/hrms"
echo "  Vercel:  https://vercel.com/dashboard (project: HRMS)"
echo ""
