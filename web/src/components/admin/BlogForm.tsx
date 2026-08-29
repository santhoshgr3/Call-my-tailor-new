import Link from "next/link";
import { inputCls, Field, SubmitButton } from "./ui";
import { saveBlogPost, deleteBlogPost } from "@/app/admin/blog/actions";

type Post = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  author: string | null;
  excerpt: string | null;
  contentHtml: string;
  coverImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
};

export function BlogForm({ post }: { post?: Post }) {
  const isEdit = !!post;
  return (
    <div className="max-w-3xl space-y-4">
      <form action={saveBlogPost} className="space-y-4 rounded-lg border border-line bg-white p-5">
        {isEdit && <input type="hidden" name="id" value={post.id} />}
        <Field label="Title">
          <input name="title" defaultValue={post?.title} required className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" hint="Leave blank to auto-generate">
            <input name="slug" defaultValue={post?.slug} className={inputCls} />
          </Field>
          <Field label="Author">
            <input name="author" defaultValue={post?.author ?? "Call My Tailor"} className={inputCls} />
          </Field>
        </div>
        <Field label="Subtitle">
          <input name="subtitle" defaultValue={post?.subtitle ?? ""} className={inputCls} />
        </Field>
        <Field label="Cover image URL">
          <input name="coverImage" defaultValue={post?.coverImage ?? ""} className={inputCls} />
        </Field>
        <Field label="Excerpt">
          <textarea name="excerpt" defaultValue={post?.excerpt ?? ""} rows={2} className={inputCls} />
        </Field>
        <Field label="Content (HTML)" hint="Paste or write HTML. Use <h2>, <p>, <ul>, <img> etc.">
          <textarea
            name="contentHtml"
            defaultValue={post?.contentHtml ?? ""}
            rows={16}
            className={inputCls + " font-mono text-xs"}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meta title">
            <input name="metaTitle" defaultValue={post?.metaTitle ?? ""} className={inputCls} />
          </Field>
          <Field label="Meta description">
            <input
              name="metaDescription"
              defaultValue={post?.metaDescription ?? ""}
              className={inputCls}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={post?.isPublished ?? true}
            className="h-4 w-4"
          />
          Published
        </label>
        <div className="flex gap-3">
          <SubmitButton>{isEdit ? "Save changes" : "Create post"}</SubmitButton>
          <Link href="/admin/blog" className="btn-outline !py-2 !text-[11px]">
            Cancel
          </Link>
        </div>
      </form>

      {isEdit && (
        <form action={deleteBlogPost} className="rounded-lg border border-red-200 bg-red-50 p-4">
          <input type="hidden" name="id" value={post.id} />
          <button className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-bold uppercase text-red-700">
            Delete post
          </button>
        </form>
      )}
    </div>
  );
}
