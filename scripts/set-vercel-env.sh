#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"

add_env() {
  local name="$1"
  local value="${!name:-}"
  if [[ -z "$value" ]]; then
    echo "Skipping $name (not available in this environment)"
    return
  fi
  printf '%s' "$value" | pnpm dlx vercel env add "$name" production --yes >/dev/null
  printf '%s\n' "Added $name"
}

export SITE_URL="https://string-art-studio-kappa.vercel.app"
export VITE_SITE_URL="$SITE_URL"
export NODE_ENV="production"

for name in NODE_ENV JWT_SECRET DATABASE_URL SUPABASE_URL SUPABASE_PUBLISHABLE_KEY SUPABASE_SERVICE_ROLE_KEY BUILT_IN_FORGE_API_URL BUILT_IN_FORGE_API_KEY VITE_FRONTEND_FORGE_API_URL VITE_FRONTEND_FORGE_API_KEY SITE_URL VITE_SITE_URL; do
  add_env "$name"
done
