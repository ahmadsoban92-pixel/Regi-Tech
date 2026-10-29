import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageShell } from "@/components/layout/PageShell";
import information from "@/content/information.json";

type InformationKey = keyof typeof information;

function isInformationKey(value: string): value is InformationKey {
  return Object.hasOwn(information, value);
}

export function generateStaticParams() {
  return Object.keys(information).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: isInformationKey(slug) ? information[slug].title : "Information" };
}

export default async function InformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isInformationKey(slug)) notFound();
  const content = information[slug];

  return (
    <PageShell>
      <article className="site-container max-w-[1000px] py-12 md:py-16">
        <Breadcrumb current={content.title} />
        <header className="mt-9">
          <h1 className="page-heading">{content.title}</h1>
          {"updated" in content ? <p className="mt-2 text-sm text-[var(--muted)]">Last updated: {content.updated}</p> : null}
          {content.intro.map((paragraph) => <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--label)]" key={paragraph}>{paragraph}</p>)}
        </header>
        <div className="mt-10 space-y-4">
          {content.sections.map((section) => (
            <section className="panel p-6 sm:p-8" key={section.heading}>
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--label)]">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      </article>
    </PageShell>
  );
}
