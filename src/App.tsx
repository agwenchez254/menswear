import { lazy, Suspense, useEffect } from "react";
import { Link, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";

const Checkout = lazy(() => import("./pages/Checkout"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const Gift = lazy(() => import("./pages/Gift"));

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith("/product")) window.scrollTo({ top: 0 });
  }, [pathname]);
  const fitScreen = pathname === "/gift";
  return (
    <div className={fitScreen ? "flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden" : undefined}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className={fitScreen ? "lg:min-h-0 lg:flex-1" : undefined}>
        <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>
      <div className={fitScreen ? "lg:hidden" : undefined}>
        <Footer />
      </div>
      <CartDrawer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <h1 className="font-display text-6xl font-semibold">Lost the thread</h1>
      <p className="mt-3 text-muted">That page does not exist.</p>
      <Link to="/" className="btn-dark mt-8">
        Go home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/category/:slug" element={<Shop />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/gift" element={<Gift />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:id" element={<Confirmation />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
