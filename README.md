# Company Leave Tracker

Small Company Vacation & Sick Leave Tracker

## Features

- Secure Login with role-based access
- User Dashboard: Vacation balance, taken, remaining, carry-forward
- Time-off Requests:
  - Submit with **mandatory reason/comment**
  - Pending requests: user can **edit or delete**
  - Approved requests: authorized users can **pull back / cancel** (with mandatory comment)
  - Full **history** of all changes always visible
  - Balance is recalculated on pull-back
- **Approver view** (`/approvals`): see pending/approved, approve, pull-back, view history
- Calendar: who is out + upcoming birthdays (and employment start dates stored)
- Overview: all users stats + Excel export for payroll
- Telegram notifications (stub ready for pull-back/edit/approve)
- Admin:
  - Create users with **employment start date** and **starting vacation balance** (required)
  - Import past taken leave via CSV template (`/admin/import`)
  - Security & Audit Trail
  - Rules engine, Aruba Holidays, company closures
  - Role management

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
4. Run SQL schema in Supabase (`supabase/schema.sql`)
5. `npm run dev`

## Aruba Specific

Supports Aruba public holidays import and company closure rules so vacation days are calculated correctly around island holidays and special company days.
