import { requireActiveUser } from "@/lib/auth/requireActiveUser";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  await requireActiveUser({ nextPath: "/admin", requireAdmin: true });
  return <AdminClient />;
}
