# S. SIKAMÒRE | Luxury E-Commerce Architecture

A headless, high-performance luxury e-commerce platform built with Next.js, React, and Supabase. Engineered with a focus on premium UI/UX, real-time data synchronization, and frictionless conversion flows.

## 🚀 Technical Stack
* **Frontend:** React, Next.js (App Router), Tailwind CSS
* **Headless Backend / CMS:** Supabase (PostgreSQL, Auth, Storage)
* **Real-Time Engine:** Supabase WebSockets (Live chat, typing indicators, cross-device sync)
* **Payment Gateway:** Paystack API
* **Transactional Emails:** Resend API

## ⚡ Core Features
* **Global Real-Time State:** Admin operations (inventory deployment, order fulfillment) instantly sync to the client dashboard without page reloads.
* **Smart Authentication:** Dynamic checkout flow that scans user emails and securely authenticates via cryptographic backend routing.
* **Live Client Concierge:** A split-screen, real-time WebSocket chat system allowing immediate communication between clients and admins.
* **Responsive Layout Physics:** Strictly controlled mobile viewports (`text-base` locking to prevent iOS zoom breaking) and isolated modal stacking.
* **Automated Dispatch Routing:** Intelligent email triggers notifying both clients and vendors when fulfillment stages change.

## 🛠️ Version Control & Deployment
Managed via Git/GitHub and deployed seamlessly on Vercel with strict environment variable protection.
