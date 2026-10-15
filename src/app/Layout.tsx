import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PromoBanner } from "@/components/layout/PromoBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { GenderCurtain } from "@/components/layout/GenderCurtain";
import { useStoreEvents } from "@/hooks/useStoreEvents";
import { ChatWidget } from "@/features/chat/ChatWidget";
import { NoticeToasts } from "@/features/notifications/NoticeToasts";
import { useOrderNotifications } from "@/features/notifications/useOrderNotifications";
import { unlockAudio } from "@/lib/chime";

/** Page chrome shared by every route: header, footer, bag drawer and the gender-switch curtain. */
export default function Layout() {
  const { pathname } = useLocation();
  useStoreEvents();
  useOrderNotifications();

  // Browsers keep sound off until the person has interacted with the page.
  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/product")) window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>
      <PromoBanner />
      <Header />
      <main key={pathname} id="main" className="page-in">
        <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <GenderCurtain />
      <NoticeToasts />
      <ChatWidget />
    </>
  );
}
