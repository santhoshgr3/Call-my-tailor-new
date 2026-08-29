import { PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { db } from "@/lib/db";

export default async function NewCategoryPage() {
  const parents = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, parentId: true },
  });
  return (
    <div>
      <PageHeader title="New category" />
      <CategoryForm parents={parents} />
    </div>
  );
}
