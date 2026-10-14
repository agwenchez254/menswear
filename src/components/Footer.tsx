import { Link } from "react-router-dom";
import { Envelope, InstagramLogo, MapPin, Phone, WhatsappLogo } from "@phosphor-icons/react";

export function Footer() {
  return (
    <footer className="mt-28 border-t border-ink/15 bg-surface">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 pb-10 pt-16 md:grid-cols-[1.5fr_1fr_1fr_1.3fr] md:px-8">
        <div>
          <p className="display max-w-[14ch] text-4xl">Good clothes, delivered to your door.</p>
          <a href="https://wa.me/254712480316" className="btn-dark mt-6" target="_blank" rel="noreferrer">
            <WhatsappLogo size={20} weight="fill" /> Chat on WhatsApp
          </a>
        </div>
        <nav aria-label="Shop" className="text-sm">
          <h3 className="font-semibold">Shop</h3>
          <ul className="mt-4 space-y-3 text-muted">
            <li><Link className="hover:text-ink" to="/shop?cat=suits">Suits and blazers</Link></li>
            <li><Link className="hover:text-ink" to="/shop?cat=shirts">Shirts</Link></li>
            <li><Link className="hover:text-ink" to="/shop?cat=shoes">Shoes</Link></li>
            <li><Link className="hover:text-ink" to="/shop?cat=kaunda">Kaunda</Link></li>
            <li><Link className="hover:text-ink" to="/gift">Send a gift</Link></li>
          </ul>
        </nav>
        <nav aria-label="Help" className="text-sm">
          <h3 className="font-semibold">Help</h3>
          <ul className="mt-4 space-y-3 text-muted">
            <li>Delivery and returns</li>
            <li>Size guide</li>
            <li>Paying with M-Pesa</li>
            <li>Track an order</li>
          </ul>
        </nav>
        <div className="space-y-4 text-sm text-muted">
          <h3 className="font-semibold text-ink">Visit the studio</h3>
          <p className="flex gap-3"><MapPin size={20} className="mt-0.5 shrink-0 text-ink" /> Kimathi House, Kimathi Street, Nairobi CBD</p>
          <p className="flex gap-3"><Phone size={20} className="shrink-0 text-ink" /> +254 712 480 316</p>
          <p className="flex gap-3"><Envelope size={20} className="shrink-0 text-ink" /> hello@jabali.co.ke</p>
          <p className="flex gap-3"><InstagramLogo size={20} className="shrink-0 text-ink" /> @jabali.menswear</p>
        </div>
      </div>
      <div className="overflow-hidden" aria-hidden>
        <p className="display select-none whitespace-nowrap px-4 text-center text-[clamp(5rem,23vw,21rem)] uppercase text-ink/[0.07]">Jabali</p>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} Jabali Menswear. Prices in Kenya Shillings and include VAT. Photography from Unsplash.
      </div>
    </footer>
  );
}
