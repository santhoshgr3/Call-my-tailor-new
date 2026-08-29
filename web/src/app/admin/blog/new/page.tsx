import { PageHeader } from "@/components/admin/ui";
import { BlogForm } from "@/components/admin/BlogForm";
export default function NewBlogPost() {
  return (
    <div>
      <PageHeader title="New blog post" />
      <BlogForm />
    </div>
  );
}
