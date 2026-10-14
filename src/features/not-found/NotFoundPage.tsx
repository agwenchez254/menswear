import { Link } from "react-router-dom";
import { ROUTES } from "@/config/routes";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <h1 className="display text-6xl">Lost the thread</h1>
      <p className="mt-3 text-muted">That page does not exist.</p>
      <Link to={ROUTES.home} className="btn-dark mt-8">
        Go home
      </Link>
    </div>
  );
}
