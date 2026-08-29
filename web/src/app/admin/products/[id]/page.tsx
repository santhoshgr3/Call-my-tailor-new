import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategoriesForForm, getProductForForm } from "@/lib/admin-helpers";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const [initial, categories] = await Promise.all([
    getProductForForm(id),
    getCategoriesForForm(),
  ]);
  if (!initial) notFound();

  return (
    <div>
      <PageHeader title="Edit product" subtitle={initial.name} />
      <ProductForm
        initial={initial}
        categories={categories}
        mode="edit"
        justCreated={created === "1"}
      />
    </div>
  );
}
