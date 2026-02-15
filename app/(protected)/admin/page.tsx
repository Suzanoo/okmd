import { requireActiveUser } from "@/lib/auth/requireActiveUser";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const me = await requireActiveUser({ requireAdmin: true });
  return <AdminClient meId={me.userId} />;
}
