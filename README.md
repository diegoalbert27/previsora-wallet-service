# Previsora Wallet

A mobile app that aggregates stablecoin balances from on-chain wallets and exchanges, and lets users split their money into savings envelopes by percentage.

## Features

- Email sign-up and sign-in
- Connect on-chain wallets (Ethereum, Sepolia) and Binance
- Balance sync, plus real-time updates for wallets through Alchemy webhooks
- Total balance with a breakdown by asset and by wallet or exchange
- Envelopes with percentage-based allocation of the user's total balance

## Stack

- **App:** Expo (React Native), TypeScript, Expo Router, bun
- **Backend:** Supabase (Postgres with RLS, Auth, Deno Edge Functions)
- **Integrations:** Alchemy (RPC and Notify webhooks), Binance API

## Structure

```
mobile/      Expo app
supabase/    Edge Functions and config
scripts/     SQL: schema, triggers and views (applied manually)
sprints/     Sprint summaries
```

## Getting started

**Database:** run `scripts/database/database.sql`, `triggers.sql` and `views.sql` in the Supabase SQL Editor.

**Edge Functions:**

```bash
supabase secrets set ENCRYPTION_KEY=... ALCHEMY_API_KEY=... ALCHEMY_AUTH_TOKEN=... ALCHEMY_WEBHOOK_ID=...
supabase functions deploy add-connection --no-verify-jwt
supabase functions deploy remove-connection --no-verify-jwt
supabase functions deploy sync-balances --no-verify-jwt
supabase functions deploy alchemy-webhook --no-verify-jwt
```

**App:**

```bash
cd mobile
cp .env.example .env.local   # Supabase URL, publishable key and functions region
bun install
bun run ios                  # or android / web
```

Disable "Confirm email" in Supabase Auth so sign-up logs the user in directly.

See `CLAUDE.md` for architecture details.
