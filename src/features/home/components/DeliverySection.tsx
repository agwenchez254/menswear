import { zones } from "@/data/delivery";
import { photo } from "@/data/photos";
import { formatKES } from "@/lib/format";
import { Photo } from "@/components/ui/Photo";

/** Delivery fees by zone over a Nairobi skyline. Static: nothing animates here. */
export function DeliverySection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0d0f0d] text-[#eceee8]">
      <Photo id={photo.nairobiSkyline} alt="Nairobi skyline at dusk reflected in water" w={1600} className="absolute inset-0 -z-10 opacity-50" position="50% 55%" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d0f0d] via-[#0d0f0d]/70 to-transparent" />
      <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
        <h2 className="display max-w-[14ch] text-[clamp(2.6rem,6vw,5.4rem)]">Delivered to every county.</h2>
        <dl className="mt-14 grid max-w-3xl gap-x-10 gap-y-8 sm:grid-cols-2">
          {zones.map((z) => (
            <div key={z.id} className="border-t border-[#eceee8]/30 pt-4">
              <dt className="flex items-baseline justify-between gap-4">
                <span className="font-semibold">{z.label}</span>
                <span className="tabular-nums text-accent">{formatKES(z.fee)}</span>
              </dt>
              <dd className="mt-1 text-sm text-[#eceee8]/70">{z.eta}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-sm text-[#eceee8]/70">Free delivery in Nairobi on orders above KES 10,000.</p>
      </div>
    </section>
  );
}
