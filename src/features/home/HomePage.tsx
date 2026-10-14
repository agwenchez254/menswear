import { useGetHomeQuery } from "@/api/home";
import { useGender } from "@/store/gender";
import { ErrorState } from "@/components/ui/ErrorState";
import { HeroSection } from "@/features/home/components/HeroSection";
import { DeliverySection } from "@/features/home/components/DeliverySection";
import { TrustSection } from "@/features/home/sections/TrustSection";
import { CategoriesSection } from "@/features/home/sections/CategoriesSection";
import { TopSellingSection } from "@/features/home/sections/TopSellingSection";
import { GiftTeaserSection } from "@/features/home/sections/GiftTeaserSection";
import { ReviewsSection } from "@/features/home/sections/ReviewsSection";

export default function HomePage() {
  const g = useGender((s) => s.gender);
  // currentData so switching men/women never renders the other side's content.
  const { currentData: data, isError, refetch } = useGetHomeQuery(g);

  if (!data) {
    if (isError) return <ErrorState title="We could not load the store" onRetry={() => void refetch()} />;
    return (
      <div className="min-h-[calc(100dvh-68px)]" aria-busy="true">
        <div className="skeleton h-[60dvh] w-full" />
      </div>
    );
  }

  return (
    <>
      {data.hero && <HeroSection key={`hero-${g}`} g={g} c={data.hero} />}
      <TrustSection items={data.trust} />
      <CategoriesSection key={`cat-${g}`} g={g} title={data.sections?.categoriesTitle || "Shop by category"} categories={data.categories} />
      <TopSellingSection key={`top-${g}`} g={g} title={data.sections?.topProductsTitle || "Best sellers"} products={data.topProducts} />
      {data.gift && <GiftTeaserSection g={g} c={data.gift} />}
      <DeliverySection />
      <ReviewsSection key={`rev-${g}`} g={g} items={data.testimonials} />
    </>
  );
}
