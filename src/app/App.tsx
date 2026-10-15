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
const OrderDetailPage = lazy(() => import("@/features/account/OrderDetailPage"));
const OrderConfirmationPage = lazy(() => import("@/features/order/OrderConfirmationPage"));
const TrackOrderPage = lazy(() => import("@/features/order/TrackOrderPage"));
const HelpPage = lazy(() => import("@/features/help/HelpPage"));
const BlogListPage = lazy(() => import("@/features/blog/BlogListPage"));
const BlogPostPage = lazy(() => import("@/features/blog/BlogPostPage"));
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
        <Route path={ROUTES.blog} element={<BlogListPage />} />
        <Route path={ROUTES.blogPost} element={<BlogPostPage />} />
        <Route path={ROUTES.track} element={<TrackOrderPage />} />
        <Route path={ROUTES.trackOrder} element={<TrackOrderPage />} />
        <Route path={ROUTES.help} element={<HelpPage />} />
        <Route path={ROUTES.account} element={<RequireCustomer><AccountPage /></RequireCustomer>} />
        <Route path={ROUTES.accountOrder} element={<RequireCustomer><OrderDetailPage /></RequireCustomer>} />
        <Route path={ROUTES.notFound} element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
