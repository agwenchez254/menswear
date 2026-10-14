interface ErrorStateProps {
  title: string;
  text?: string;
  onRetry?: () => void;
}

/** Shown when the API cannot be reached or returns an error. */
export function ErrorState({ title, text = "Check your connection and try again.", onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="mx-auto max-w-xl px-4 py-32 text-center">
      <h1 className="display text-5xl">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      {onRetry && (
        <button className="btn-dark mt-8" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
