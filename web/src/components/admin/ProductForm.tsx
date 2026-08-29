"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { inputCls, Field, SubmitButton } from "./ui";
import {
  createProduct,
  updateProduct,
  type ProductFormState,
} from "@/app/admin/products/actions";

type Cat = { id: string; name: string; parentId: string | null };
type ImageRow = { url: string; alt: string };
type SpecRow = { key: string; value: string };
type OptRow = {
  label: string;
  type: string;
  required: boolean;
  values: { label: string; priceDelta: number }[];
};

export type ProductInitial = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  oldPrice: number | "";
  stockStatus: string;
  quantity: number;
  shortDescription: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  rating: number;
  ratingCount: number;
  soldCount: number;
  images: ImageRow[];
  specs: SpecRow[];
  options: OptRow[];
  categoryIds: string[];
};

export function ProductForm({
  initial,
  categories,
  mode,
  justCreated,
}: {
  initial: ProductInitial;
  categories: Cat[];
  mode: "create" | "edit";
  justCreated?: boolean;
}) {
  const action = mode === "create" ? createProduct : updateProduct;
  const [state, formAction] = useActionState<ProductFormState, FormData>(action, {});

  const [images, setImages] = useState<ImageRow[]>(initial.images);
  const [specs, setSpecs] = useState<SpecRow[]>(initial.specs);
  const [options, setOptions] = useState<OptRow[]>(initial.options);
  const [catIds, setCatIds] = useState<string[]>(initial.categoryIds);
  const [uploading, setUploading] = useState(false);

  const parents = categories.filter((c) => !c.parentId);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => [...prev, { url: data.url, alt: initial.name }]);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  const move = (arr: ImageRow[], i: number, dir: -1 | 1): ImageRow[] => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const copy = [...arr];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  return (
    <form action={formAction} className="space-y-6 pb-16">
      {mode === "edit" && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="specs" value={JSON.stringify(specs)} />
      <input type="hidden" name="options" value={JSON.stringify(options)} />
      <input type="hidden" name="categoryIds" value={JSON.stringify(catIds)} />

      {justCreated && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Product created.
        </p>
      )}
      {state.error && (
        <p className="rounded border border-brand/40 bg-brand/5 px-3 py-2 text-sm text-brand">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Basic */}
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-4 font-bold">Basic information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" className="sm:col-span-2">
                <input name="name" defaultValue={initial.name} required className={inputCls} />
              </Field>
              <Field label="Slug" hint="Leave blank to auto-generate from name">
                <input name="slug" defaultValue={initial.slug} className={inputCls} />
              </Field>
              <Field label="SKU / Product Code">
                <input name="sku" defaultValue={initial.sku} className={inputCls} />
              </Field>
              <Field label="Price (₹)">
                <input
                  name="price"
                  type="number"
                  min={0}
                  defaultValue={initial.price}
                  className={inputCls}
                />
              </Field>
              <Field label="Compare-at / old price (₹)">
                <input
                  name="oldPrice"
                  type="number"
                  min={0}
                  defaultValue={initial.oldPrice || ""}
                  className={inputCls}
                />
              </Field>
              <Field label="Stock status">
                <select name="stockStatus" defaultValue={initial.stockStatus} className={inputCls}>
                  <option>In Stock</option>
                  <option>Made to Order</option>
                  <option>Pre-Order</option>
                  <option>Out Of Stock</option>
                </select>
              </Field>
              <Field label="Quantity">
                <input
                  name="quantity"
                  type="number"
                  min={0}
                  defaultValue={initial.quantity}
                  className={inputCls}
                />
              </Field>
              <Field label="Short description" className="sm:col-span-2">
                <textarea
                  name="shortDescription"
                  defaultValue={initial.shortDescription}
                  rows={2}
                  className={inputCls}
                />
              </Field>
              <Field label="Full description" className="sm:col-span-2">
                <textarea
                  name="description"
                  defaultValue={initial.description}
                  rows={6}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Images */}
          <div className="rounded-lg border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Images</h2>
              <label className="btn-outline !py-1.5 !text-[11px]">
                {uploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => upload(e.target.files)}
                />
              </label>
            </div>
            <div className="space-y-2">
              {images.map((im, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={im.url}
                    alt=""
                    className="h-12 w-10 shrink-0 rounded border border-line object-cover"
                  />
                  <input
                    value={im.url}
                    onChange={(e) =>
                      setImages((p) => p.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))
                    }
                    className={inputCls}
                    placeholder="/img/… or https://…"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((p) => move(p, i, -1))}
                    className="px-1 text-faint"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages((p) => move(p, i, 1))}
                    className="px-1 text-faint"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((_, k) => k !== i))}
                    className="px-1 text-brand"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setImages((p) => [...p, { url: "", alt: initial.name }])}
                className="text-xs font-semibold text-brand"
              >
                + Add image URL
              </button>
            </div>
          </div>

          {/* Specs */}
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-4 font-bold">Item specifics</h2>
            <div className="space-y-2">
              {specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s.key}
                    onChange={(e) =>
                      setSpecs((p) => p.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)))
                    }
                    placeholder="Attribute (e.g. Fabric Brand)"
                    className={inputCls}
                  />
                  <input
                    value={s.value}
                    onChange={(e) =>
                      setSpecs((p) =>
                        p.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)),
                      )
                    }
                    placeholder="Value (e.g. Raymond)"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs((p) => p.filter((_, k) => k !== i))}
                    className="px-2 text-brand"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSpecs((p) => [...p, { key: "", value: "" }])}
                className="text-xs font-semibold text-brand"
              >
                + Add specific
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-4 font-bold">Options</h2>
            <div className="space-y-4">
              {options.map((o, i) => (
                <div key={i} className="rounded border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={o.label}
                      onChange={(e) =>
                        setOptions((p) =>
                          p.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)),
                        )
                      }
                      placeholder="Option label"
                      className={`${inputCls} flex-1`}
                    />
                    <select
                      value={o.type}
                      onChange={(e) =>
                        setOptions((p) =>
                          p.map((x, k) => (k === i ? { ...x, type: e.target.value } : x)),
                        )
                      }
                      className={inputCls + " w-auto"}
                    >
                      <option value="select">select</option>
                      <option value="radio">radio</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={o.required}
                        onChange={(e) =>
                          setOptions((p) =>
                            p.map((x, k) => (k === i ? { ...x, required: e.target.checked } : x)),
                          )
                        }
                      />
                      required
                    </label>
                    <button
                      type="button"
                      onClick={() => setOptions((p) => p.filter((_, k) => k !== i))}
                      className="px-2 text-brand"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 pl-3">
                    {o.values.map((v, vi) => (
                      <div key={vi} className="flex gap-2">
                        <input
                          value={v.label}
                          onChange={(e) =>
                            setOptions((p) =>
                              p.map((x, k) =>
                                k === i
                                  ? {
                                      ...x,
                                      values: x.values.map((vv, kk) =>
                                        kk === vi ? { ...vv, label: e.target.value } : vv,
                                      ),
                                    }
                                  : x,
                              ),
                            )
                          }
                          placeholder="Value"
                          className={inputCls}
                        />
                        <input
                          type="number"
                          value={v.priceDelta}
                          onChange={(e) =>
                            setOptions((p) =>
                              p.map((x, k) =>
                                k === i
                                  ? {
                                      ...x,
                                      values: x.values.map((vv, kk) =>
                                        kk === vi
                                          ? { ...vv, priceDelta: Number(e.target.value) }
                                          : vv,
                                      ),
                                    }
                                  : x,
                              ),
                            )
                          }
                          placeholder="+₹"
                          className={inputCls + " w-24"}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setOptions((p) =>
                              p.map((x, k) =>
                                k === i
                                  ? { ...x, values: x.values.filter((_, kk) => kk !== vi) }
                                  : x,
                              ),
                            )
                          }
                          className="px-2 text-brand"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((p) =>
                          p.map((x, k) =>
                            k === i
                              ? { ...x, values: [...x.values, { label: "", priceDelta: 0 }] }
                              : x,
                          ),
                        )
                      }
                      className="text-xs font-semibold text-brand"
                    >
                      + Add value
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setOptions((p) => [
                    ...p,
                    { label: "", type: "select", required: false, values: [] },
                  ])
                }
                className="text-xs font-semibold text-brand"
              >
                + Add option
              </button>
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-4 font-bold">SEO</h2>
            <div className="space-y-4">
              <Field label="Meta title">
                <input name="metaTitle" defaultValue={initial.metaTitle} className={inputCls} />
              </Field>
              <Field label="Meta description">
                <textarea
                  name="metaDescription"
                  defaultValue={initial.metaDescription}
                  rows={2}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-bold">Visibility</h2>
            <div className="space-y-2 text-sm">
              {(
                [
                  ["isActive", "Active (visible on site)"],
                  ["isFeatured", "Featured"],
                  ["isBestSeller", "Best Seller"],
                  ["isNewArrival", "New Arrival"],
                  ["isTrending", "Trending"],
                ] as const
              ).map(([name, label]) => (
                <label key={name} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={name}
                    defaultChecked={initial[name]}
                    className="h-4 w-4"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-bold">Ratings</h2>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Rating">
                <input
                  name="rating"
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  defaultValue={initial.rating}
                  className={inputCls}
                />
              </Field>
              <Field label="# reviews">
                <input
                  name="ratingCount"
                  type="number"
                  min={0}
                  defaultValue={initial.ratingCount}
                  className={inputCls}
                />
              </Field>
              <Field label="Sold">
                <input
                  name="soldCount"
                  type="number"
                  min={0}
                  defaultValue={initial.soldCount}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-bold">Categories</h2>
            <div className="max-h-72 space-y-1 overflow-y-auto text-sm">
              {parents.map((parent) => (
                <div key={parent.id}>
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={catIds.includes(parent.id)}
                      onChange={(e) =>
                        setCatIds((p) =>
                          e.target.checked ? [...p, parent.id] : p.filter((x) => x !== parent.id),
                        )
                      }
                    />
                    {parent.name}
                  </label>
                  {categories
                    .filter((c) => c.parentId === parent.id)
                    .map((child) => (
                      <label key={child.id} className="ml-5 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={catIds.includes(child.id)}
                          onChange={(e) =>
                            setCatIds((p) =>
                              e.target.checked
                                ? [...p, child.id]
                                : p.filter((x) => x !== child.id),
                            )
                          }
                        />
                        {child.name}
                      </label>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-white/95 px-5 py-3 backdrop-blur md:pl-64">
        <SubmitButton>{mode === "create" ? "Create product" : "Save changes"}</SubmitButton>
        <Link href="/admin/products" className="btn-outline !py-2 !text-[11px]">
          Cancel
        </Link>
        {mode === "edit" && initial.id && (
          <Link
            href={`/product/${initial.slug}`}
            target="_blank"
            className="ml-auto text-xs text-brand hover:underline"
          >
            View on site ↗
          </Link>
        )}
      </div>
    </form>
  );
}
