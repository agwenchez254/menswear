import { useGender } from "@/store/gender";
import { homeConfig } from "@/features/home/config";
import { HeroSection } from "@/features/home/components/HeroSection";
import { DeliverySection } from "@/features/home/components/DeliverySection";
import { TrustSection } from "@/features/home/sections/TrustSection";
import { CategoriesSection } from "@/features/home/sections/CategoriesSection";
import { TopSellingSection } from "@/features/home/sections/TopSellingSection";
import { GiftTeaserSection } from "@/features/home/sections/GiftTeaserSection";
import { ReviewsSection } from "@/features/home/sections/ReviewsSection";

export default function HomePage() {
  const g = useGender((s) => s.gender);
  return (
    <>
      <HeroSection key={`hero-${g}`} g={g} c={homeConfig[g].hero} />
      <TrustSection g={g} />
      <CategoriesSection key={`cat-${g}`} g={g} />
      <TopSellingSection key={`top-${g}`} g={g} />
      <GiftTeaserSection g={g} />
      <DeliverySection />
      <ReviewsSection key={`rev-${g}`} g={g} />
    </>
  );
}
