import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { db } from "@/lib/db";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [category, parents] = await Promise.all([
    db.category.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, parentId: true } }),
  ]);
  if (!category) notFound();
  return (
    <div>
      <PageHeader title="Edit category" subtitle={category.name} />
      <CategoryForm category={category} parents={parents} />
    </div>
  );
}
