#!/bin/bash
# =================================================================
# SkoraCare Automated aaPanel Deployment Script
# Place this script on your aaPanel server at: /www/wwwroot/deploy.sh
# =================================================================

set -e

echo "======================================================="
echo "🚀 [$(date '+%Y-%m-%d %H:%M:%S')] Starting Automated Deployment..."
echo "======================================================="

# Target project directory on aaPanel (adjust to your website root)
PROJECT_DIR="/www/wwwroot/skora-pms"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory $PROJECT_DIR not found!"
    exit 1
fi

cd "$PROJECT_DIR"

# 1. Pull latest code from GitHub main branch
echo "📦 Fetching latest updates from Git..."
git fetch origin main
git reset --hard origin/main

# 2. Ensure environment variables exist
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env not found! Creating from .env.example..."
    cp .env.example .env
fi

# 3. Install dependencies
echo "📥 Installing dependencies..."
npm install --legacy-peer-deps

# 4. Run automated database migrations (new tables, columns, indexes)
echo "🗄️ Running database migrations..."
npm run db:migrate

# 5. Build Next.js production application
echo "🔨 Building Next.js application..."
npm run build

# 6. Reload PM2 with Zero Downtime
echo "♻️ Restarting Node service (skoracare)..."
pm2 reload skoracare --update-env || pm2 restart skoracare --update-env || pm2 start npm --name "skoracare" -- start

echo "======================================================="
echo "✅ [$(date '+%Y-%m-%d %H:%M:%S')] SkoraCare is LIVE!"
echo "======================================================="
