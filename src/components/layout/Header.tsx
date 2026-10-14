import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Gift, List, MagnifyingGlass, Moon, ShoppingBag, Sun, X } from "@phosphor-icons/react";
import { useCart } from "@/store/cart";
import { useGender } from "@/store/gender";
import { useTheme } from "@/hooks/useTheme";
import { cartCount } from "@/services/pricing";
import { mainNav } from "@/config/navigation";
import { Logo } from "@/components/layout/Logo";
import { GenderToggle } from "@/components/layout/GenderToggle";

export function Header() {
  const navigate = useNavigate();
  const count = useCart((s) => cartCount(s.lines));
  const setOpen = useCart((s) => s.setOpen);
  const gender = useGender((s) => s.gender);
  const { dark, toggle } = useTheme();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [bump, setBump] = useState(0);
  const links = mainNav[gender];

  useEffect(() => {
    if (count > 0) setBump((b) => b + 1);
  }, [count]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
    setSearch(false);
    setMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex items-center gap-2 lg:gap-6">
          <button className="-ml-2 grid size-11 place-items-center hover:bg-ink/5 md:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
            <List size={24} />
          </button>
          <Logo />
          <div className="hidden md:block">
            <GenderToggle id="gender-pill-desktop" />
          </div>
        </div>
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.label} to={l.to} className="group relative text-sm font-medium text-ink">
              {l.label}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </NavLink>
          ))}
        </nav>
        <div className="-mr-2 flex items-center">
          <div className="mr-1 md:hidden">
            <GenderToggle compact id="gender-pill-mobile" />
          </div>
          <AnimatePresence initial={false}>
            {search && (
              <motion.form
                key="s"
                onSubmit={submit}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "min(46vw, 260px)", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
                className="overflow-hidden"
              >
                <label className="sr-only" htmlFor="hdr-search">
                  Search products
                </label>
                <input id="hdr-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={gender === "men" ? "Search suits, shoes..." : "Search dresses, bags..."} className="field h-10 min-h-10 py-0 text-sm" />
              </motion.form>
            )}
          </AnimatePresence>
          <button className="grid size-11 place-items-center hover:bg-ink/5 max-md:hidden" onClick={() => setSearch((s) => !s)} aria-label={search ? "Close search" : "Search"}>
            {search ? <X size={22} /> : <MagnifyingGlass size={22} />}
          </button>
          <button className="grid size-11 place-items-center hover:bg-ink/5 max-sm:hidden" onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
            {dark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <Link to="/gift" className="hidden size-11 place-items-center hover:bg-ink/5 lg:grid" aria-label="Gifts">
            <Gift size={22} />
          </Link>
          <button className="relative grid size-11 place-items-center hover:bg-ink/5" onClick={() => setOpen(true)} aria-label={`Open bag, ${count} items`}>
            <ShoppingBag size={22} />
            {count > 0 && (
              <motion.span
                key={bump}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center bg-accent px-1 text-[11px] font-bold leading-[18px] text-accent-ink [border-radius:var(--r-soft)]"
              >
                {count}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {menu && (
            <>
              <motion.div className="fixed inset-0 z-50 bg-ink/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 flex w-[84vw] max-w-sm flex-col overflow-y-auto bg-paper p-6 shadow-2xl"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 260, damping: 32 }}
                aria-label="Menu"
              >
                <div className="flex items-center justify-between">
                  <Logo />
                  <button className="grid size-11 place-items-center hover:bg-ink/5" onClick={() => setMenu(false)} aria-label="Close menu">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={submit} className="mt-6">
                  <label className="sr-only" htmlFor="m-search">
                    Search products
                  </label>
                  <input id="m-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="field" />
                </form>
                <nav className="mt-6 flex flex-col" aria-label="Mobile">
                  {links.map((l) => (
                    <Link key={l.label} to={l.to} onClick={() => setMenu(false)} className="display border-b border-line py-4 text-4xl">
                      {l.label}
                    </Link>
                  ))}
                </nav>
                <button onClick={toggle} className="btn-ghost mt-6 self-start">
                  {dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? "Light theme" : "Dark theme"}
                </button>
                <p className="mt-auto pt-8 text-sm text-muted">WhatsApp us on +254 712 480 316</p>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  );
}
