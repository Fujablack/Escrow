# Escrow – setup
1. Install Node.js (nodejs.org). In this folder run: npm install
2. Supabase: new project > SQL Editor > paste supabase.sql > Run.
   Settings > API: copy Project URL and service_role key.
3. Copy .env.example to .env.local and fill in the 4 values (use Paystack TEST secret key first).
4. npm run dev  -> open http://localhost:3000
5. Paystack webhook: Settings > API Keys & Webhooks > Webhook URL = https://YOUR-SITE/api/webhook
   (locally, use a tunnel such as ngrok).
