#!/bin/bash
# Script pour configurer les variables d'environnement sur Vercel
# Usage: bash scripts/set-vercel-env.sh
# Prérequis: vercel CLI installé (npm i -g vercel) + vercel login

echo "Configuration des variables d'environnement Vercel..."

vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://nnmpzsygfyacnhyuaogr.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "sb_publishable_ohogaMhTcBoUwj4joQEAAg_NgcdHaHC"
vercel env add SUPABASE_SERVICE_KEY production <<< "$(grep SUPABASE_SERVICE_KEY .env.local | cut -d= -f2)"
vercel env add N8N_CHAT_URL production <<< "$(grep N8N_CHAT_URL .env.local | grep -v PUBLIC | cut -d= -f2)"
vercel env add NEXT_PUBLIC_MANAGER_PASSWORD production <<< "$(grep NEXT_PUBLIC_MANAGER_PASSWORD .env.local | cut -d= -f2)"
vercel env add NEXT_PUBLIC_DIRECTOR_PASSWORD production <<< "$(grep NEXT_PUBLIC_DIRECTOR_PASSWORD .env.local | cut -d= -f2)"
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production <<< "$(grep NEXT_PUBLIC_VAPID_PUBLIC_KEY .env.local | cut -d= -f2)"
vercel env add VAPID_PRIVATE_KEY production <<< "$(grep VAPID_PRIVATE_KEY .env.local | cut -d= -f2)"
vercel env add VAPID_EMAIL production <<< "$(grep VAPID_EMAIL .env.local | cut -d= -f2)"
vercel env add PUSH_API_SECRET production <<< "$(grep PUSH_API_SECRET .env.local | cut -d= -f2)"

echo "✅ Variables configurées ! Lance: vercel --prod"
