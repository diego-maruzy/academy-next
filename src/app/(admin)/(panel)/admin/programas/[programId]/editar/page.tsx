import { notFound } from "next/navigation";
import { AdminProgramForm } from "@/components/admin/programs/admin-program-form";
import { getProgramById } from "@/lib/academy-data";

type EditAdminProgramPageProps = {
  params: Promise<{ programId: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditAdminProgramPage({
  params,
}: EditAdminProgramPageProps) {
  const { programId } = await params;
  const program = await getProgramById(programId);

  if (!program) {
    notFound();
  }

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          Programas ADM
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Editar programa
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">{program.name}</p>
      </section>

      <AdminProgramForm
        programId={program.id}
        defaultValues={{
          name: program.name,
          slug: program.slug,
          description: program.description ?? "",
          published: program.published,
          display_order: program.display_order,
          is_premium: program.is_premium,
          upgrade_url: program.upgrade_url ?? "",
          cover_image_url: program.cover_image_url,
        }}
      />
    </div>
  );
}
