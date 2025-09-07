import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import EditorClient from "./editor/EditorClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session.user) {
    redirect("/login");
  }
  return <EditorClient />;
}

