import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAllPostsMeta } from "@/lib/posts";
import EditorClient from "./editor/EditorClient";
import AdminPostsTable from "./posts/AdminPostsTable";

export default async function AdminPage() {
  const session = await getSession();
  if (!session.user) {
    redirect("/login");
  }
  const posts = await getAllPostsMeta({ includeDrafts: true });
  return (
    <section>
      <EditorClient />
      <div style={{ marginTop: "2rem" }}>
        <AdminPostsTable initialPosts={posts} />
      </div>
    </section>
  );
}

