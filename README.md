# Jabali

Menswear and womenswear store for the Kenyan market. React 19, TypeScript (strict), Vite, Tailwind v4, Zustand and Motion.

```bash
npm install
npm run dev      # development server
npm run build    # type-check, then production build
```

## Folder structure

```
src/
  app/                 App shell: route table (App.tsx) and page chrome (Layout.tsx)
  models/              Shared types only. Product, Cart, Order, Zone, Gender store, UI and motion props
  config/              Business rules and constants: commerce.ts, navigation.ts, routes.ts
  data/                Static catalogue: photos, categories, products, delivery zones
  services/            Pure business logic: pricing.ts (totals, delivery fee, promo), order.ts (build an order)
  store/               Zustand stores: cart, gender
  hooks/               Shared hooks: useTheme
  lib/                 Small helpers: format, phone
  components/
    layout/            Header, Footer, CartDrawer, GenderToggle, GenderCurtain, Logo
    product/           ProductCard
    ui/                Photo, Field
  features/            One folder per area of the product
    home/              HomePage, config.ts, sections/, components/ (hero, delivery band), models/
    shop/              ShopPage, components/, hooks/, lib/, constants.ts, models/
    product/           ProductPage, components/, constants.ts, models/
    checkout/          CheckoutPage, components/ (steps), validation.ts, constants.ts, models/
    gift/              GiftPage, components/ (GiftUnwrap, Confetti), constants.ts, models/
    order/             OrderConfirmationPage
    not-found/         NotFoundPage
```

## Conventions

- **Types live in `models/`.** Shared domain and component-prop types go in `src/models`. Types used by one feature go in `features/<name>/models`. Components import them with `import type`.
- **Import with the `@/` alias** (`@/features/shop/constants`), never long relative paths.
- **Features own their pages, components, hooks, constants and models.** A feature may import from `components/`, `models/`, `config/`, `data/`, `services/`, `store/`, `lib/` and `hooks/`, but not from another feature's internals.
- **Business logic stays out of components.** Totals, delivery fees, promo codes, validation and order creation are plain functions in `services/` or the feature's `validation.ts`, so they are easy to test.
- **Motion is minimal and cheap.** Entrances are CSS keyframes (`.rise`, `.fade-in`, `.wipe-in`, `.page-in` in `index.css`), transform and opacity only. Motion (the library) is used only for things the user triggers: drawers, the filter sheet, the Men/Women toggle and curtain, checkout steps and the gift unwrap. There are no scroll listeners, parallax or always-running loops, and everything respects `prefers-reduced-motion`.
- **Theming** is CSS variables in `src/index.css`, switched by `data-gender` (men or women) and `data-theme` (light or dark) on `<html>`.
- **Photos** come from Unsplash (`data/photos.ts`). Replace the IDs, or change `img()`, to use your own CDN.
