import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import Layout from "@/app/Layout";
import HomePage from "@/features/home/HomePage";
import ShopPage from "@/features/shop/ShopPage";
import ProductPage from "@/features/product/ProductPage";
import NotFoundPage from "@/features/not-found/NotFoundPage";
import { RequireCustomer } from "@/features/auth/RequireCustomer";

// Heavier or less-visited routes load on demand.
const CheckoutPage = lazy(() => import("@/features/checkout/CheckoutPage"));
const AccountPage = lazy(() => import("@/features/auth/AccountPage"));
const OrderConfirmationPage = lazy(() => import("@/features/order/OrderConfirmationPage"));
const GiftPage = lazy(() => import("@/features/gift/GiftPage"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.shop} element={<ShopPage />} />
        <Route path={ROUTES.category} element={<ShopPage />} />
        <Route path={ROUTES.product} element={<ProductPage />} />
        <Route path={ROUTES.gift} element={<GiftPage />} />
        <Route path={ROUTES.checkout} element={<RequireCustomer><CheckoutPage /></RequireCustomer>} />
        <Route path={ROUTES.order} element={<OrderConfirmationPage />} />
        <Route path={ROUTES.account} element={<RequireCustomer><AccountPage /></RequireCustomer>} />
        <Route path={ROUTES.notFound} element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
