#!/bin/bash
# Russell Labs — Automated Setup Script
# For use in a fresh Ubuntu 22.04 sandbox with Node 22 + pnpm pre-installed
# Generated with Grok-3 assistance

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          Russell Labs — Project Setup                    ║"
echo "║   AI Mental Health + Education Platform                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Check prerequisites ──────────────────────────────────────────
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 22+."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "⚠️  Node.js $NODE_VERSION detected. Version 22+ recommended."
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ Node $(node -v) | pnpm $(pnpm -v)"
echo ""

# ── Install dependencies ─────────────────────────────────────────
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# ── Environment check ────────────────────────────────────────────
echo "🔐 Environment variable check..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "VITE_APP_ID"
    "OAUTH_SERVER_URL"
    "VITE_OAUTH_PORTAL_URL"
    "BUILT_IN_FORGE_API_URL"
    "BUILT_IN_FORGE_API_KEY"
)

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "   ⚠️  $var — not set"
        MISSING=$((MISSING + 1))
    else
        echo "   ✅ $var — set"
    fi
done

if [ "$MISSING" -gt 0 ]; then
    echo ""
    echo "⚠️  $MISSING required variables not set."
    echo "   In a Manus sandbox, these are auto-injected."
    echo "   For standalone, create a .env file with these values."
    echo "   See README-PORTABLE.md for details."
else
    echo "✅ All required environment variables set"
fi
echo ""

# ── TypeScript check ─────────────────────────────────────────────
echo "🔎 Running TypeScript type check..."
if pnpm check 2>/dev/null; then
    echo "✅ No TypeScript errors"
else
    echo "⚠️  TypeScript errors detected (may be due to missing env types)"
fi
echo ""

# ── Run tests ────────────────────────────────────────────────────
echo "🧪 Running test suite..."
if pnpm test 2>/dev/null; then
    echo "✅ All tests passing"
else
    echo "⚠️  Some tests failed (may need database connection)"
fi
echo ""

# ── Database migration instructions ─────────────────────────────
echo "🗄️  Database Setup"
echo "   Migration files are in drizzle/ (0000 through 0009)."
echo "   Apply them in order to your MySQL/TiDB database."
echo ""
echo "   In Manus sandbox: use webdev_execute_sql"
echo "   Standalone: for f in drizzle/000*.sql; do mysql < \$f; done"
echo ""

# ── Start instructions ───────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Setup complete! Next steps:                             ║"
echo "║                                                          ║"
echo "║  1. Ensure environment variables are set                 ║"
echo "║  2. Apply database migrations (drizzle/000*.sql)         ║"
echo "║  3. Start dev server: pnpm dev                           ║"
echo "║  4. Or build for production: pnpm build && pnpm start    ║"
echo "║                                                          ║"
echo "║  See README-PORTABLE.md for full documentation.          ║"
echo "╚══════════════════════════════════════════════════════════╝"
