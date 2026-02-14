import { requireActiveUser } from "@/lib/auth/requireActiveUser";

import BOQClient from "./_components/BOQClient";

export default async function BOQPage() {
  await requireActiveUser({ nextPath: "/boq" });

  return <BOQClient />;
}
