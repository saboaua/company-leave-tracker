# Company Leave Tracker

Small Company Vacation & Sick Leave Tracker

## Features

- Secure Login with role-based access
- User Dashboard: Vacation balance, taken, remaining, carry-forward
- Time-off Requests: Submit, view pending/approved, types (Vacation, Special Leave, Medical)
- Approvals: Configurable self-approval or multi-user approval
- Calendar: See who is out of office
- Overview: All users stats + Excel export for payroll (monthly breakdown)
- Telegram Bot: Submit requests and receive notifications
- Admin:
  - Security & Audit Trail (brute force, SQLi detection, logs, graphs)
  - Telegram setup and notifications
  - Rules engine (e.g., no sick leave H1/H2 bonuses)
  - Aruba Holidays import (non-deductible company closures)
  - Company special closure days (deductible)
  - User & role management
  - Carry-forward rules with reminders

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- Telegram Bot API
- ExcelJS for exports
- Recharts for audit graphs

## Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill Supabase + Telegram keys
4. Run SQL schema in Supabase
5. `npm run dev`

## Aruba Specific

Supports Aruba public holidays import and company closure rules so vacation days are calculated correctly around island holidays and special company days.
