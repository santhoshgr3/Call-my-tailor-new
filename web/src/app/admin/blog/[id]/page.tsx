import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { BlogForm } from "@/components/admin/BlogForm";
import { db } from "@/lib/db";
export default async function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div>
      <PageHeader title="Edit blog post" subtitle={post.title} />
      <BlogForm post={post} />
    </div>
  );
}
