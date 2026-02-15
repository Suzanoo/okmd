"use client";

/**
 * AdminClient (Paginated)
 * ----------------------
 * Cost-friendly user management:
 * - Server-side pagination via Supabase `.range()`
 * - Server-side filters/sort applied only when user clicks "Apply"
 *   (prevents per-keystroke queries and keeps Supabase costs low)
 * - Optimistic updates for role/status changes (no full reload)
 *
 * Notes:
 * - Assumes server guard: `requireActiveUser({ requireAdmin: true })`
 * - RLS ensures only admin can list/update profiles
 * - DB trigger should prevent self-lockout; UI also disables self actions.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

import CreateUserDialog from "./CreateUserDialog";
import ResetPasswordDialog from "./ResetPasswordDialog";

type Role = "admin" | "editor" | "viewer";
type RoleFilter = Role | "all";
type StatusFilter = "all" | "active" | "disabled";
type SortKey = "created_desc" | "created_asc" | "email_asc" | "role_desc";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at?: string;
};

function isRoleFilter(v: string): v is RoleFilter {
  return v === "all" || v === "admin" || v === "editor" || v === "viewer";
}
function isStatusFilter(v: string): v is StatusFilter {
  return v === "all" || v === "active" || v === "disabled";
}
function isSortKey(v: string): v is SortKey {
  return (
    v === "created_desc" ||
    v === "created_asc" ||
    v === "email_asc" ||
    v === "role_desc"
  );
}

export default function AdminClient({ meId }: { meId: string }) {
  const supabase = useMemo(() => supabaseBrowser(), []);

  // data
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState<number>(0);

  // loading/errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(20);

  // "draft" filters (user is typing/selecting; no query yet)
  const [qDraft, setQDraft] = useState("");
  const [roleDraft, setRoleDraft] = useState<RoleFilter>("all");
  const [statusDraft, setStatusDraft] = useState<StatusFilter>("all");
  const [sortDraft, setSortDraft] = useState<SortKey>("created_desc");

  // "applied" filters (used in query)
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_desc");

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  /**
   * fetchUsers()
   * ------------
   * Fetches a single page of profiles + total count.
   * Uses `count: "exact"` for pagination.
   */
  const fetchUsers = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      setLoading(true);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Base query
      let query = supabase
        .from("profiles")
        .select("id,email,full_name,role,is_active,created_at", {
          count: "exact",
        });

      // Filters (server-side)
      const needle = q.trim();
      if (needle) {
        // Search email OR full_name
        // (If you later add phone/company etc, extend this OR.)
        query = query.or(`email.ilike.%${needle}%,full_name.ilike.%${needle}%`);
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      // Sort
      if (sortKey === "created_desc")
        query = query.order("created_at", { ascending: false });
      if (sortKey === "created_asc")
        query = query.order("created_at", { ascending: true });
      if (sortKey === "email_asc")
        query = query.order("email", { ascending: true });
      if (sortKey === "role_desc")
        query = query.order("role", { ascending: false });

      // Page window
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (signal?.aborted) return;

      if (error) {
        setError(error.message);
        setUsers([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setUsers((data ?? []) as Profile[]);
      setTotal(count ?? 0);
      setLoading(false);
    },
    [supabase, page, pageSize, q, roleFilter, statusFilter, sortKey],
  );

  // initial load + whenever applied filters/page/pageSize changes
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      await fetchUsers(controller.signal);
    })();
    return () => controller.abort();
  }, [fetchUsers]);

  /**
   * applyFilters()
   * --------------
   * Moves "draft" controls into "applied" state and resets page to 1.
   * This is the key cost-control: only queries when user clicks Apply.
   */
  function applyFilters() {
    setPage(1);
    setQ(qDraft);
    setRoleFilter(roleDraft);
    setStatusFilter(statusDraft);
    setSortKey(sortDraft);
  }

  function resetFilters() {
    setPage(1);

    setQDraft("");
    setRoleDraft("all");
    setStatusDraft("all");
    setSortDraft("created_desc");

    setQ("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortKey("created_desc");
  }

  /**
   * updateRole() - optimistic
   * ------------------------
   * Updates local page instantly. Rolls back on error.
   */
  async function updateRole(id: string, role: Role) {
    const prev = users;
    setUsers((curr) => curr.map((u) => (u.id === id ? { ...u, role } : u)));

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);
    if (error) {
      setError(error.message);
      setUsers(prev);
    }
  }

  /**
   * toggleActive() - optimistic
   * --------------------------
   * Flips local state instantly. Rolls back on error.
   */
  async function toggleActive(id: string, current: boolean) {
    const prev = users;
    setUsers((curr) =>
      curr.map((u) => (u.id === id ? { ...u, is_active: !current } : u)),
    );

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) {
      setError(error.message);
      setUsers(prev);
    }
  }

  // Aggregation (for current filtered result set): we only know total count, not counts by role,
  // without extra queries. Keep it light: show total + page stats.
  const pageStats = useMemo(() => {
    const active = users.filter((u) => u.is_active).length;
    const disabled = users.length - active;
    return { active, disabled };
  }, [users]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Admin - User Management</h1>
          <p className="text-xs text-muted-foreground">
            Invite-only: admin creates accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-white/5"
            onClick={() => fetchUsers()}
          >
            Refresh
          </button>

          {/* Avoid type mismatch: wrap to call without signal */}
          <CreateUserDialog
            onCreated={async () => {
              // after create, refresh current applied query (still cost-friendly: 1 query)
              await fetchUsers();
            }}
          />
        </div>
      </div>

      {/* Controls (draft) */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3">
        <input
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm sm:w-72"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
          placeholder="Search email or name..."
        />

        <select
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={roleDraft}
          onChange={(e) => {
            const v = e.target.value;
            if (isRoleFilter(v)) setRoleDraft(v);
          }}
        >
          <option value="all">All roles</option>
          <option value="admin">admin</option>
          <option value="editor">editor</option>
          <option value="viewer">viewer</option>
        </select>

        <select
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={statusDraft}
          onChange={(e) => {
            const v = e.target.value;
            if (isStatusFilter(v)) setStatusDraft(v);
          }}
        >
          <option value="all">All status</option>
          <option value="active">active</option>
          <option value="disabled">disabled</option>
        </select>

        <select
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={sortDraft}
          onChange={(e) => {
            const v = e.target.value;
            if (isSortKey(v)) setSortDraft(v);
          }}
        >
          <option value="created_desc">Newest</option>
          <option value="created_asc">Oldest</option>
          <option value="email_asc">Email A→Z</option>
          <option value="role_desc">Role (admin first)</option>
        </select>

        <select
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={String(pageSize)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n > 0) {
              setPage(1);
              setPageSize(n);
            }
          }}
          title="Rows per page"
        >
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>

        <button
          className="ml-auto rounded-xl bg-foreground px-3 py-2 text-sm font-medium text-background"
          onClick={applyFilters}
        >
          Apply
        </button>

        <button
          className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-white/5"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      {/* Pagination + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-muted-foreground">
          Result: <span className="text-foreground font-medium">{total}</span>{" "}
          users • Page{" "}
          <span className="text-foreground font-medium">{page}</span> /{" "}
          <span className="text-foreground font-medium">{pageCount}</span> •
          This page:{" "}
          <span className="text-foreground font-medium">{users.length}</span>{" "}
          users (
          <span className="text-green-400">{pageStats.active} active</span>,{" "}
          <span className="text-red-400">{pageStats.disabled} disabled</span>)
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        {loading ? (
          <div className="py-4 text-sm text-muted-foreground">Loading...</div>
        ) : null}

        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="text-left">
              <th className="py-2">Email</th>
              <th className="py-2">Name</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="py-2">
                  {u.email}
                  {u.id === meId ? (
                    <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      You
                    </span>
                  ) : null}
                </td>

                <td className="py-2">
                  {u.full_name || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                <td className="py-2">
                  <select
                    value={u.role}
                    disabled={u.id === meId}
                    onChange={(e) => updateRole(u.id, e.target.value as Role)}
                    className="rounded-md border border-border bg-background px-2 py-1 disabled:opacity-50"
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
                  <div className="flex items-center gap-2">
                    <button
                      disabled={u.id === meId}
                      onClick={() => toggleActive(u.id, u.is_active)}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-white/5 disabled:opacity-50"
                    >
                      {u.is_active ? "Disable" : "Enable"}
                    </button>

                    <ResetPasswordDialog
                      userId={u.id}
                      email={u.email}
                      onDone={() => fetchUsers()}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {!loading && users.length === 0 ? (
              <tr>
                <td
                  className="py-6 text-center text-muted-foreground"
                  colSpan={5}
                >
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
