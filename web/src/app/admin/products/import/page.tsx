import Link from "next/link";
import { PageHeader, Card } from "@/components/admin/ui";
import { ProductImporter } from "@/components/admin/ProductImporter";

export const dynamic = "force-dynamic";

export default function ImportProductsPage() {
  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Import / Export products"
        subtitle="Add or update many products at once with an Excel or CSV file"
        action={
          <Link href="/admin/products" className="btn-outline !py-2 !text-[11px]">
            ← Back to products
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="font-bold">1. Get the template</h2>
          <p className="mt-1 text-xs text-faint">
            A ready-made Excel sheet with every column, an example row and instructions.
          </p>
          <a href="/api/admin/products/export?template=1" className="btn-outline mt-3 !py-2 !text-[11px]">
            Download template (.xlsx)
          </a>
        </Card>
        <Card>
          <h2 className="font-bold">2. Or export what you have</h2>
          <p className="mt-1 text-xs text-faint">
            Download all products, edit prices, stock or descriptions in Excel, and upload it back.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/admin/products/export" className="btn-outline !py-2 !text-[11px]">
              Export all (.xlsx)
            </a>
            <a href="/api/admin/products/export?format=csv" className="btn-outline !py-2 !text-[11px]">
              CSV
            </a>
          </div>
        </Card>
        <Card>
          <h2 className="font-bold">Good to know</h2>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-faint">
            <li>You always see a preview first; nothing is saved until you confirm.</li>
            <li>Existing products are matched by SKU, then slug.</li>
            <li>Blank cells are left unchanged when updating.</li>
            <li>Images are web links (or /media/… links from the Media Library).</li>
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-bold">3. Upload your file</h2>
        <ProductImporter />
      </Card>
    </div>
  );
}
