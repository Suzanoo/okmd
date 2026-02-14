import { requireActiveUser } from "@/lib/auth/requireActiveUser";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // เช็ค login + is_active (ครั้งเดียว)
  await requireActiveUser();

  return <>{children}</>;
}
