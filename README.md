# Klivora

> Free invoicing, accounting, and payroll — built for everyone.

Klivora is a full-stack Wave Apps alternative that makes professional accounting accessible to freelancers and small businesses. It's free forever, with optional Stripe payment processing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | React.js + Vite |
| Mobile | React Native + Expo |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe |

## Project Structure

```
Klivora/
├── web/        React.js web application
├── mobile/     React Native Expo mobile app
├── backend/    Node.js + Express REST API
└── database/   PostgreSQL schema + migrations
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account (free)
- Stripe account (optional, for payments)

### 1. Clone and install
```bash
git clone https://github.com/yourusername/Klivora.git
cd Klivora

# Backend
cd backend && npm install

# Web
cd ../web && npm install

# Mobile
cd ../mobile && npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` in each sub-package and fill in your keys.

### 3. Set up database
Run `database/schema.sql` in your Supabase SQL editor.

### 4. Start development
```bash
# Backend (port 3001)
cd backend && npm run dev

# Web (port 5173)
cd web && npm run dev

# Mobile
cd mobile && npx expo start
```

## Features

- ✅ Professional invoicing with PDF generation
- ✅ Customer management
- ✅ Expense tracking with receipt scanning (OCR)
- ✅ Double-entry accounting
- ✅ Payroll management with payslips
- ✅ Financial reports (P&L, Balance Sheet, Tax)
- ✅ Stripe payment links on invoices
- ✅ Email delivery of invoices
- ✅ Mobile app (iOS & Android)

## License

MIT — free to use, modify, and distribute.
