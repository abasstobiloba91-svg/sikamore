# S. SIKAMÒRE | Luxury E-Commerce Architecture

A headless, high-performance luxury e-commerce platform built with Next.js, React, and Supabase. Engineered with a focus on premium UI/UX, real-time data synchronization, exclusive drop mechanics, and frictionless conversion flows.

## 🚀 Technical Stack

* **Frontend:** React, Next.js (App Router), Tailwind CSS
* **Headless Backend / CMS:** Supabase (PostgreSQL, Auth, Real-Time WebSockets)
* **Asset Storage:** Cloudflare R2 (Zero-egress image hosting with pre-upload canvas compression)
* **Payments & Geolocation:** Paystack API, IPAPI (Dynamic currency routing)
* **Transactional Emails:** Resend API (Automated HTML dispatches & branded newsletters)

## ⚡ Core Features

* **Exclusive Waitlist & Campaign Engine:** Bi-directional product routing for limited-edition drops. The "Ship to Store" protocol instantly pushes waitlist items to the live storefront and automatically dispatches HTML release emails to targeted leads. The "Revert" protocol securely archives live pieces back to the waitlist with custom campaign badges.
* **Global Currency & Logistics:** IP-based geolocation silently detects international traffic and seamlessly translates live storefront and waitlist pricing from NGN to USD, utilizing a custom exchange rate dynamically controlled via the admin ledger.
* **Bespoke Luxury UI/UX:** Standard browser alerts (confirms/prompts) are completely overridden by custom, z-index-layered React modals. Strict mobile viewport physics (`text-base` input locking) prevent iOS zoom distortion, maintaining an unbroken premium aesthetic.
* **Global Real-Time State:** Admin operations (inventory deployment, order fulfillment, ticket management) instantly sync across the client dashboard without manual page reloads via Supabase WebSockets.
* **Live Client Concierge:** A split-screen, real-time WebSocket chat system equipped with live typing indicators, allowing immediate, encrypted communication between clients and the administrative team.
* **Smart Authentication & Automated Dispatch:** A dynamic checkout flow that securely authenticates via cryptographic backend routing, paired with intelligent email triggers that notify both clients and internal vendors when fulfillment stages evolve.

## 🛠️ Version Control & Deployment

Managed via Git/GitHub and deployed seamlessly on Vercel with strict environment variable protection and robust edge-caching configurations.
