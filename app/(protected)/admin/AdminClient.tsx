"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import CreateUserDialog from "./CreateUserDialog";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "editor" | "viewer";
  is_active: boolean;
  created_at?: string;
};

export default function AdminClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,role,is_active,created_at")
        .order("created_at", { ascending: false });

      // ถ้า component unmount ระหว่างรอ fetch → ไม่อัปเดต state
      if (signal?.aborted) return;

      if (error) {
        setError(error.message);
        setUsers([]);
        setLoading(false);
        return;
      }

      setUsers((data ?? []) as Profile[]);
      setLoading(false);
    },
    [supabase],
  );

  useEffect(() => {
    const controller = new AbortController();

    // ✅ React 19 friendly: ทำงานใน async IIFE (ไม่เรียก setState sync ตรงๆ ใน effect body)
    (async () => {
      await loadUsers(controller.signal);
    })();

    return () => controller.abort();
  }, [loadUsers]);

  async function updateRole(id: string, role: Profile["role"]) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    await loadUsers();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase
      .from("profiles")
      .update({ is_active: !current })
      .eq("id", id);
    await loadUsers();
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin - User Management</h1>
      <CreateUserDialog onCreated={loadUsers} />
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface p-4">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="text-left">
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="py-2">{u.email}</td>

                <td className="py-2">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      updateRole(u.id, e.target.value as Profile["role"])
                    }
                    className="rounded-md border border-border bg-background px-2 py-1"
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>

                <td className="py-2">
                  {u.is_active ? (
                    <span className="text-green-400">active</span>
                  ) : (
                    <span className="text-red-400">disabled</span>
                  )}
                </td>

                <td className="py-2">
                  <button
                    onClick={() => toggleActive(u.id, u.is_active)}
                    className="rounded-md border border-border px-2 py-1"
                  >
                    Toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
