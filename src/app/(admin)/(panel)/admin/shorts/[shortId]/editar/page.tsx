import { notFound } from "next/navigation";
import { AdminShortForm } from "@/components/admin/shorts/admin-short-form";
import { getShortById } from "@/lib/shorts-data";

type EditAdminShortPageProps = {
  params: Promise<{ shortId: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditAdminShortPage({
  params,
}: EditAdminShortPageProps) {
  const { shortId } = await params;
  const short = await getShortById(shortId);

  if (!short) {
    notFound();
  }

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          Shorts
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Editar short
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">{short.title}</p>
      </section>

      <AdminShortForm
        shortId={short.id}
        defaultValues={{
          title: short.title,
          slug: short.slug,
          description: short.description ?? "",
          category: short.category ?? "",
          video_url: short.video_url,
          video_provider: short.video_provider,
          thumbnail_url: short.thumbnail_url ?? "",
          duration_label: short.duration_label ?? "",
          cta_label: short.cta_label ?? "",
          cta_url: short.cta_url ?? "",
          published: short.published,
          featured: short.featured,
          display_order: short.display_order,
        }}
      />
    </div>
  );
}
