import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPostBySlug } from "@/lib/posts";
import EditorClient from "../../../editor/EditorClient";

export default async function EditPostPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session.user) redirect("/login");
  const post = await getPostBySlug(params.slug);
  if (!post) redirect("/admin");
  return (
    <section>
      <h2>Edit Post</h2>
      <EditorClient initialTitle={post.meta.title} initialHTML={post.html} initialSlug={post.meta.slug} mode="edit" />
    </section>
  );
}

