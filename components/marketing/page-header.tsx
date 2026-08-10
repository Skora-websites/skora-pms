export function PageHeader({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-accent-50/40 to-brand-50 pb-14 pt-36 lg:pt-44">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/5" />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {badge && <span className="badge bg-brand-100 text-brand-800">{badge}</span>}
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink lg:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
