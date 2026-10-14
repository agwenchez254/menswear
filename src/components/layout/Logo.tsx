import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link to="/" className="display text-[28px] uppercase" aria-label="Jabali home">
      Jabali<span className="text-accent [-webkit-text-stroke:1px_var(--fg)]">.</span>
    </Link>
  );
}
