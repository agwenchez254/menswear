import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Gift, List, MagnifyingGlass, Moon, ShoppingBag, Sun, X } from "@phosphor-icons/react";
import { cartCount, useCart } from "../store/cart";

const links = [
  { to: "/shop", label: "Shop" },
  { to: "/shop?cat=suits", label: "Suits" },
  { to: "/shop?cat=shoes", label: "Shoes" },
  { to: "/shop?sort=new", label: "New in" },
  { to: "/gift", label: "Gifts" },
];

export function Logo() {
  return (
    <Link to="/" className="display text-[28px] uppercase" aria-label="Jabali Menswear home">
      Jabali<span className="text-accent [-webkit-text-stroke:1px_var(--fg)]">.</span>
    </Link>
  );
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    return attr ? attr === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("jabali-theme", next ? "dark" : "light");
    } catch {
      /* storage can be blocked; the toggle still works for this visit */
    }
  };
  return { dark, toggle };
}

export function Header() {
  const navigate = useNavigate();
  const count = useCart((s) => cartCount(s.lines));
  const setOpen = useCart((s) => s.setOpen);
  const { dark, toggle } = useTheme();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [bump, setBump] = useState(0);

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
      <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-2">
          <button className="-ml-2 grid size-11 place-items-center hover:bg-ink/5 md:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
            <List size={24} />
          </button>
          <Logo />
        </div>
        <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.label} to={l.to} className="group relative text-sm font-medium text-ink">
              {l.label}
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </NavLink>
          ))}
        </nav>
        <div className="-mr-2 flex items-center">
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
                <input id="hdr-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search suits, shoes..." className="field h-10 min-h-10 py-0 text-sm" />
              </motion.form>
            )}
          </AnimatePresence>
          <button className="grid size-11 place-items-center hover:bg-ink/5" onClick={() => setSearch((s) => !s)} aria-label={search ? "Close search" : "Search"}>
            {search ? <X size={22} /> : <MagnifyingGlass size={22} />}
          </button>
          <button className="grid size-11 place-items-center hover:bg-ink/5" onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
            {dark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <Link to="/gift" className="hidden size-11 place-items-center hover:bg-ink/5 sm:grid" aria-label="Gifts">
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
                className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center bg-accent px-1 text-[11px] font-bold leading-[18px] text-accent-ink"
              >
                {count}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      {createPortal(<AnimatePresence>
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
              <nav className="mt-10 flex flex-col" aria-label="Mobile">
                {links.map((l) => (
                  <Link key={l.label} to={l.to} onClick={() => setMenu(false)} className="display border-b border-line py-4 text-4xl">
                    {l.label}
                  </Link>
                ))}
              </nav>
              <p className="mt-auto text-sm text-muted">WhatsApp us on +254 712 480 316</p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>, document.body)}
    </header>
  );
}
