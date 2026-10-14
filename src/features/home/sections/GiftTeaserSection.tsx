import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { byId } from "@/data/products";
import { GiftUnwrap } from "@/features/gift/components/GiftUnwrap";
import { homeConfig } from "@/features/home/config";
import type { HomeSectionProps } from "@/features/home/models";

export function GiftTeaserSection({ g }: HomeSectionProps) {
  const c = homeConfig[g].gift;
  const p = byId(c.productId)!;
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <h2 className="display max-w-[12ch] text-[clamp(2.6rem,6vw,5.4rem)]">Some gifts deserve a reveal.</h2>
          <div>
            <p className="mt-6 max-w-[46ch] text-lg text-muted">Pick the piece, choose the box, write the card. Your recipient opens it with a small ceremony, right on their phone.</p>
            <div className="mt-8">
              <Link to="/gift" className="btn-accent group h-14 px-9 text-base">
                Build a gift <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
        <div className="min-h-[520px]">
          <GiftUnwrap key={g} instant product={p} color={c.color} wrap={c.wrap} ribbon={c.ribbon} message={c.message} from={c.from} to={c.to} runKey={1} />
        </div>
      </div>
    </section>
  );
}
