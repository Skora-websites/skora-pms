import { PageHeader } from "./page-header";

export function PolicyContent({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader badge="Policy" title={title} subtitle={`Last updated: ${updated}`} />
      <section className="py-16">
        <div className="prose-policy mx-auto max-w-3xl space-y-8 px-5 lg:px-0">
          {children}
        </div>
      </section>
    </>
  );
}

export function PolicyBlock({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-ink">{heading}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-muted">{children}</div>
    </div>
  );
}
