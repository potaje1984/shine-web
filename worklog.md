# Shine Web App — Worklog

---
Task ID: 1
Agent: main
Task: Add Home Cleaning service with didactic explanations and customer quote acceptance

Work Log:
- Fixed critical syntax error in types.ts (Spanish comment breaking ServiceType union)
- Rewrote cleaning-how.tsx: 6-step detailed timeline with color-coded stages, visual SVG lifecycle flow diagram with legend
- Rewrote payment-explanation.tsx: Added "Why save card?" section, 3-phase step cards with detail text, SVG flow diagrams for both laundry and cleaning payments (desktop + mobile), Stripe security badge
- Updated laundry-nav.tsx: Added "Cleaning" and "Payments" nav links with Home icon
- Added acceptCleaningQuote() and rejectCleaningQuote() to use-orders.ts hook
  - Auto-charges card when customer accepts cleaning quote
  - Creates notification on acceptance
- Updated dashboard/page.tsx: Added quote acceptance UI (Accept/Reject buttons) for orders in "quoted" status
- Updated orders-table.tsx: Same quote acceptance UI with error handling
- Added comprehensive i18n keys in both en.ts and es.ts:
  - cleaning.customer.* (quote acceptance UI strings)
  - landing.howCleaningWorks.* (6 steps with detail text, security section)
  - landing.paymentExplanation.* (whySaveTitle, whySave1-3, phaseLabel, detail texts, securityBadge)
  - landing.services.houseCleaning.* (service card data)
  - landing.nav.cleaning/payments
  - diagram.* (25+ labels for SVG diagrams)
  - status.pendingQuote/quoted/accepted/inProgress/completed

Stage Summary:
- Build passes with 0 errors
- Cleaning service now has complete customer-facing flow with quote acceptance
- Landing page has didactic visual diagrams for both services
- Payment explanation includes SVG flow diagrams showing each stage
- Customer can now accept/reject cleaning quotes from dashboard and orders page