import { Link } from "react-router-dom";
import { useSiteSettings } from "@/api/settings";
import { useGender } from "@/store/gender";
import { footerShopLinks } from "@/config/navigation";
import { FooterWordmark } from "@/components/layout/FooterWordmark";
import { Envelope, InstagramLogo, MapPin, Phone, WhatsappLogo } from "@phosphor-icons/react";

export function Footer() {
  const gender = useGender((st) => st.gender);
  const { whatsappDigits, whatsappDisplay } = useSiteSettings();
  return (
    <footer className="mt-28 border-t border-ink/15 bg-surface">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 pb-10 pt-16 md:grid-cols-[1.5fr_1fr_1fr_1.3fr] md:px-8">
        <div>
          <p className="display max-w-[14ch] text-4xl">Good clothes, delivered to your door.</p>
          <a href={`https://wa.me/${whatsappDigits}`} className="btn-dark mt-6" target="_blank" rel="noreferrer">
            <WhatsappLogo size={20} weight="fill" /> Chat on WhatsApp
          </a>
        </div>
        <nav aria-label="Shop" className="text-sm">
          <h3 className="font-semibold">Shop</h3>
          <ul className="mt-4 space-y-3 text-muted">
            {footerShopLinks[gender].map(({ slug, label }) => (
              <li key={slug}>
                <Link className="hover:text-ink" to={`/shop?cat=${slug}`}>
                  {label}
                </Link>
              </li>
            ))}
            <li><Link className="hover:text-ink" to="/gift">Send a gift</Link></li>
            <li><Link className="hover:text-ink" to="/blog">The journal</Link></li>
          </ul>
        </nav>
        <nav aria-label="Help" className="text-sm">
          <h3 className="font-semibold">Help</h3>
          <ul className="mt-4 space-y-3 text-muted">
            <li><Link className="hover:text-ink" to="/help/delivery-and-returns">Delivery and returns</Link></li>
            <li><Link className="hover:text-ink" to="/help/size-guide">Size guide</Link></li>
            <li><Link className="hover:text-ink" to="/help/paying-with-mpesa">Paying with M-Pesa</Link></li>
            <li><Link className="hover:text-ink" to="/faq">Questions and answers</Link></li>
            <li><Link className="hover:text-ink" to="/track">Track an order</Link></li>
          </ul>
        </nav>
        <div className="space-y-4 text-sm text-muted">
          <h3 className="font-semibold text-ink">Visit the studio</h3>
          <p className="flex gap-3"><MapPin size={20} className="mt-0.5 shrink-0 text-ink" /> Kimathi House, Kimathi Street, Nairobi CBD</p>
          <p className="flex gap-3"><Phone size={20} className="shrink-0 text-ink" /> {whatsappDisplay}</p>
          <p className="flex gap-3"><Envelope size={20} className="shrink-0 text-ink" /> hello@jabali.co.ke</p>
          <p className="flex gap-3"><InstagramLogo size={20} className="shrink-0 text-ink" /> @jabali.menswear</p>
        </div>
      </div>
      <FooterWordmark />
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} Jabali. Prices in Kenya Shillings and include VAT. Photography from Unsplash.
      </div>
    </footer>
  );
}
