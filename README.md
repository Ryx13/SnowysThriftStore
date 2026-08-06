# Snowy's Thrift Store

A storefront and lightweight order-management system for a small South African thrift
clothing reseller, built as a real e-commerce site rather than a demo — it's designed
around how the business actually operates: stock is one-of-one (thrifted items, no
inventory counts), delivery runs through PAXI (South African parcel-to-store courier),
and a chat handoff to WhatsApp is a first-class checkout path, not an afterthought.

## Stack

- **React 19 + TypeScript**, **Vite**, **React Router**
- **Tailwind CSS v4**
- **Supabase** — Postgres database, authentication, file storage, and Realtime
  (chat), used as the entire backend
- **lucide-react** for icons

## Why Supabase

The site needed authentication, a relational data model (products →
categories/subcategories, orders → chat threads → messages), file storage for product
photos, and something realtime for the order chat — without standing up and hosting a
custom backend for what's fundamentally a small storefront. Supabase covers all four
from one project: Postgres with Row Level Security policies enforcing who can read/write
what, built-in email/password auth feeding a `profiles` table, Storage for product
images, and Realtime subscriptions powering the chat inbox.

`src/lib/supabase.ts` is the single client instance the rest of the app imports —
initialized from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, which is safe to
expose client-side because RLS policies (defined in the Supabase project, not in this
repo) are what actually gate access, not the anon key itself.

## Structure

```
SnowysThriftStore/
├── src/
│   ├── App.tsx                      # Route definitions
│   ├── pages/
│   │   ├── StorefrontPage.tsx          # Product grid, category/subcategory filtering
│   │   └── ProductPage.tsx              # Single product detail view
│   ├── components/
│   │   ├── AuthForm.tsx                  # Sign in / sign up
│   │   ├── EditProductModal.tsx            # Edit an existing product
│   │   ├── ImageCropModal.tsx                # Client-side crop before upload
│   │   ├── ProductDetailModal.tsx              # Quick-view product modal
│   │   ├── CartDrawer.tsx                       # Slide-out cart
│   │   ├── CheckoutModal.tsx                     # Buyer details → order creation
│   │   └── ChatInbox.tsx                          # Realtime order chat
│   └── lib/
│       ├── supabase.ts                # Supabase client init
│       ├── AuthContext.tsx              # Session + profile state, app-wide
│       ├── CartContext.tsx               # Cart state, persisted to localStorage
│       ├── useCategories.ts               # Fetches categories/subcategories
│       ├── storage.ts                      # Supabase Storage helpers (image cleanup)
│       ├── whatsapp.ts                      # Builds the WhatsApp checkout deep link
│       └── constants.ts                      # Size charts, condition labels
```

## Data model (Supabase / Postgres)

The app assumes these tables exist in the connected Supabase project (schema lives in
the Supabase dashboard, not as migration files in this repo):

- **`profiles`** — one row per authenticated user: `full_name` and `phone_number`,
  linked 1:1 to Supabase's built-in auth user.
- **`categories`** / **`subcategories`** — consumed by the storefront filters via
  `useCategories`.
- **`products`** — thrifted items: title, price, standard size (`XXS`–`XXL`), SA size
  (`26`–`42`), condition (`NWT` / `Excellent` / `Good` / `Fair`), category, and image
  URLs. Since stock is one-of-one secondhand items, there's no quantity field — a
  product either exists (available) or is removed once sold.
- **`order_threads`** / **`messages`** — created on checkout, holding the order
  summary, subtotal, and PAXI delivery destination; messages are the realtime chat tied
  to that order.

Image files for products go into a Supabase Storage bucket (`product-images`);
`storage.ts` handles resolving a stored file's path back out of its public URL so it
can be cleaned up when a product is deleted or its images are replaced.

## Checkout: WhatsApp handoff or in-app chat

`CheckoutModal` collects the buyer's name, phone, PAXI store code, and destination
city, then lets the buyer choose how they want to finalize the order:

- **WhatsApp** — `whatsapp.ts` builds a pre-filled `wa.me` link summarizing the order
  (items, sizes, condition, subtotal, buyer + delivery details) so the conversation
  continues on WhatsApp, where this seller's existing customers already expect to
  transact.
- **In-app chat** — creates an `order_threads` row and opens `ChatInbox`, a Supabase
  Realtime-backed chat, for buyers who'd rather not switch apps.

Either path records the order in Supabase first — WhatsApp is a communication channel
layered on top of a real order record, not a replacement for one.

## Local development

```bash
git clone https://github.com/Ryx13/SnowysThriftStore.git
cd SnowysThriftStore
npm install
```

Create `.env` in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SELLER_WHATSAPP_NUMBER=27xxxxxxxxx   # international format, no leading +
```

You'll need a Supabase project with the tables described above and RLS policies
restricting writes appropriately — this repo is the frontend and the Supabase project
is the backend, provisioned separately.

```bash
npm run dev       # local dev server
npm run build      # tsc -b && vite build — production build
npm run preview     # serve the production build locally
npm run lint          # oxlint
```

## Deployment

Any static host works since this is a Vite SPA with no server-side code of its own —
all backend logic lives in Supabase. Set the same environment variables in your host's
build settings, build with `npm run build`, and serve `dist/`. If deploying to a host
that doesn't handle SPA fallback automatically, routes need to fall back to
`index.html` for React Router's client-side routing to work on a hard refresh.

## Author

Ryan Dube — [ryxvoid.xyz](https://ryxvoid.xyz) · [linkedin.com/in/ryxvoid](https://linkedin.com/in/ryxvoid)
