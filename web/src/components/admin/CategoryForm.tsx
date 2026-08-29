import Link from "next/link";
import { inputCls, Field, SubmitButton } from "./ui";
import { createCategory, updateCategory, deleteCategory } from "@/app/admin/categories/actions";

type Cat = { id: string; name: string; parentId: string | null };

export function CategoryForm({
  category,
  parents,
}: {
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    description: string | null;
    image: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    sortOrder: number;
    isActive: boolean;
    showInMenu: boolean;
  };
  parents: Cat[];
}) {
  const isEdit = !!category;
  const action = isEdit ? updateCategory : createCategory;

  return (
    <div className="max-w-2xl space-y-4">
      <form action={action} className="space-y-4 rounded-lg border border-line bg-white p-5">
        {isEdit && <input type="hidden" name="id" value={category.id} />}
        <Field label="Name">
          <input name="name" defaultValue={category?.name} required className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" hint="Leave blank to auto-generate">
            <input name="slug" defaultValue={category?.slug} className={inputCls} />
          </Field>
          <Field label="Parent category">
            <select name="parentId" defaultValue={category?.parentId ?? ""} className={inputCls}>
              <option value="">— None (top level) —</option>
              {parents
                .filter((p) => p.id !== category?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.parentId ? "— " : ""}
                    {p.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Sort order">
            <input
              name="sortOrder"
              type="number"
              defaultValue={category?.sortOrder ?? 0}
              className={inputCls}
            />
          </Field>
          <Field label="Image URL">
            <input name="image" defaultValue={category?.image ?? ""} className={inputCls} />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            name="description"
            defaultValue={category?.description ?? ""}
            rows={3}
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meta title">
            <input name="metaTitle" defaultValue={category?.metaTitle ?? ""} className={inputCls} />
          </Field>
          <Field label="Meta description">
            <input
              name="metaDescription"
              defaultValue={category?.metaDescription ?? ""}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={category?.isActive ?? true}
              className="h-4 w-4"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showInMenu"
              defaultChecked={category?.showInMenu ?? true}
              className="h-4 w-4"
            />
            Show in navigation menu
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <SubmitButton>{isEdit ? "Save changes" : "Create category"}</SubmitButton>
          <Link href="/admin/categories" className="btn-outline !py-2 !text-[11px]">
            Cancel
          </Link>
        </div>
      </form>

      {isEdit && (
        <form
          action={deleteCategory}
          className="rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <input type="hidden" name="id" value={category.id} />
          <p className="mb-2 text-sm text-red-700">
            Deleting removes this category. Products keep existing but lose this category link.
            Sub-categories become top-level.
          </p>
          <button className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-bold uppercase text-red-700">
            Delete category
          </button>
        </form>
      )}
    </div>
  );
}
