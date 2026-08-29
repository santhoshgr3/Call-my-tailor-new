import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategoriesForForm, EMPTY_PRODUCT } from "@/lib/admin-helpers";

export default async function NewProductPage() {
  const categories = await getCategoriesForForm();
  return (
    <div>
      <PageHeader title="New product" subtitle="Add a product to your catalog" />
      <ProductForm initial={EMPTY_PRODUCT} categories={categories} mode="create" />
    </div>
  );
}
