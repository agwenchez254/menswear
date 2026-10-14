# Kenyan Menswear Shop: Design & Build Plan

A professional men's clothing e-commerce shop for the Kenyan market, built with a React frontend. Features: eye-catching hero, categories, top sellers, filterable products page, simple guest checkout (shipping, payment, review), and a gifting feature with a realistic unwrap animation.

> "Figting feature" in the original brief is interpreted as **gifting**. Confirm this.

## 1. Visual direction

**Premium editorial menswear**: dark, confident, uncluttered, with real photography doing the work.

| Token | Value | Use |
|---|---|---|
| Primary | `#1C1917` | Headers, dark sections |
| Secondary | `#44403C` | Secondary surfaces |
| Accent | `#A16207` (gold) | CTAs, price highlights |
| Background | `#FAFAF9` | Page |
| Foreground | `#0C0A09` | Text |
| Card | `#FFFFFF` | Cards |
| Muted | `#E8ECF0` | Muted surfaces |
| Muted foreground | `#475569` | Secondary text |
| Border | `#D6D3D1` | Dividers |
| Destructive | `#DC2626` | Errors |
| Success (added) | `#16A34A` | M-Pesa and order confirmations only |

- **Fonts:** Cormorant (headings) + Montserrat (body/UI).
  `https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap`
- **Icons:** Lucide SVG only, no emoji.
- **Contrast:** gold text must be checked against 4.5:1. Use `#A16207` on dark or white, not on `#E8ECF0`.
- **Rejected:** the "Liquid Glass" style suggested by the search (Apple-platform chrome) and "Vibrant & Block-based" (flagged to avoid).

## 2. Tech stack

- React + Vite + TypeScript, React Router
- Tailwind CSS with the tokens above as CSS variables
- GSAP + `@gsap/react` for hero and gift animation; Framer Motion for small UI transitions
- Zustand for cart and checkout (persisted to `localStorage`); TanStack Query for products
- React Hook Form + Zod for forms
- Backend: undecided. Start with a mock JSON API, swap later.
- React rules: derive filtered lists during render (no `useEffect`), `useDeferredValue` for search, stable list keys.

## 3. Site map

`/` Home · `/shop` All products · `/category/:slug` · `/product/:slug` · `/cart` · `/checkout` · `/order/:id` · `/gift` · `/account/orders` (optional, later)

## 4. Pages

### Home
1. **Hero:** full-bleed model photo, large Cormorant headline, gold "Shop the Collection" button, secondary "Send a Gift". Slow parallax and staggered headline reveal. WebP under 200KB, sized to avoid layout shift.
2. **Trust strip:** M-Pesa accepted, delivery across Kenya, easy returns, WhatsApp support.
3. **Categories:** tall image tiles for Shirts, Trousers, Suits and Blazers, Shoes, T-shirts, Jackets, Accessories, Traditional/Kaunda. Stagger in on scroll.
4. **Top selling:** carousel on mobile, grid on desktop, "Bestseller" badges.
5. **Gift teaser:** dark banner linking to `/gift`.
6. **Reviews and footer:** customer reviews, newsletter, WhatsApp link.

### All products (`/shop`)
- **Filters:** price range slider with KES inputs, category, size (S to XXL; shoes 39 to 46), colour, On sale / New.
- **Sort:** newest, price low to high, price high to low, best-selling.
- **Layout:** left sidebar on desktop; bottom-sheet "Filters" button on mobile.
- **Active filters:** removable chips, result count, "Clear all".
- **URL state:** filters live in the URL (shareable, back button works).
- **Loading and empty:** skeleton cards that reserve space; empty state with "Reset filters".
- **Cards:** whole card clickable, second image on hover, "Quick add" on mobile, prices as "KES 2,500".

### Product detail
Gallery, size selector (disabled when out of stock), size guide in cm, stock count, delivery estimate by county, "Send as gift" toggle.

## 5. Checkout (guest, 3 steps, "Step 2 of 3" indicator)

1. **Contact and delivery**
   - Name, phone (+254 mask), email (optional), county (dropdown), town/area, street or landmark.
   - Delivery options auto-filled from county: Nairobi same-day/next-day, other counties by courier, shop pickup.
   - Fees shown before commitment.
2. **Payment**
   - **M-Pesa STK Push** (default): enter number, "Check your phone to enter your PIN", poll for result. Fallback: Till/Paybill instructions.
   - Card.
   - Pay on Delivery (Nairobi only).
   - Airtel Money.
3. **Review and place order**
   - Editable summary, promo code, total with delivery.
   - Sticky order summary on desktop; collapsible on mobile.

**Confirmation:** order number, SMS/WhatsApp receipt, tracking link.

**Usability rules**
- Visible labels always (never placeholder-only); errors next to the field.
- Loading state on buttons; Back never loses data.
- Correct mobile keyboards (`inputMode="tel"`); tap targets at least 44px.
- No forced account creation.

## 6. Gifting feature

**Flow:** pick a gift or Gift Card (KES 1,000 / 2,500 / 5,000 / custom), choose wrapping (box colour, ribbon), write a message, enter recipient details and optional delivery date, add to cart. The recipient's address can be collected via a link; prices can be hidden on the packing slip.

**Gift-box unwrap animation (GSAP timeline, about 3.5s)**
1. Box slides in with a soft shadow and small bounce.
2. Ribbon pulls loose with tension-like easing.
3. Lid pops open and tilts; light rays burst from inside.
4. Product rises out slowly with a gold confetti burst.
5. Message card unfolds beside the product.

- **Realism:** layered soft shadows, SVG gradients for ribbon and lid, slightly varied timing.
- **Performance:** animate only `transform` and `opacity`; cap particles at about 60 on mobile; `canvas-confetti` or a light canvas.
- **Accessibility:** "Skip animation" button; `prefers-reduced-motion` shows the opened state immediately.
- **Reuse:** same animation as the builder preview and when the recipient opens the gift link.

## 7. Motion rules

- Hover and press: 150 to 250ms. Section reveals: 400 to 600ms. Hero and gift show: 1 to 3.5s.
- Easing: `power2.out`; `back.out(1.4)` for product tiles.
- Stagger at most 8 items; pin at most one scroll section.
- Everything respects `prefers-reduced-motion`.

Reference snippet (grid stagger):
```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4,
  stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

## 8. Build order

1. Scaffold, tokens, layout, header (search, cart badge), mobile nav, footer.
2. Product data model and product card.
3. Shop page with filters and URL state.
4. Home sections and hero.
5. Product detail, cart drawer, cart store.
6. Checkout (3 steps, validation, M-Pesa pending state against a mock API).
7. Gift flow and unwrap animation.
8. Accessibility, responsive (375/768/1024/1440px) and performance pass.

## 9. Pre-delivery checklist

- [ ] No emojis as icons (Lucide SVG)
- [ ] `cursor-pointer` on clickable elements
- [ ] Hover transitions 150 to 300ms
- [ ] Text contrast at least 4.5:1
- [ ] Visible keyboard focus states
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 375, 768, 1024, 1440px
- [ ] No horizontal scroll; layout shift under 0.1

## 10. Open decisions

- "Fighting" vs "gifting": is gifting right?
- Payment gateway: Daraja (direct M-Pesa), Pesapal, Flutterwave, or IntaSend?
- Language: English only, or English and Swahili?
- Products: real products and photos, or placeholder data?
- Currency: KES only (assumed)?
