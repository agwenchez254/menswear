import { Link } from "react-router-dom";

/**
 * The men's "sassy" Jabali logo, used on both sides of the store so the brand looks the same for everyone.
 * The light and dark artwork are both in the page; index.css shows the one that matches the current theme.
 */
export function Logo() {
  return (
    <Link to="/" className="block shrink-0" aria-label="Jabali home">
      <img src="/brand/jabali-sassy-men-light.svg" alt="" width={548} height={288} className="logo-light h-11 w-auto" />
      <img src="/brand/jabali-sassy-men-dark.svg" alt="" width={548} height={288} className="logo-dark h-11 w-auto" />
    </Link>
  );
}
