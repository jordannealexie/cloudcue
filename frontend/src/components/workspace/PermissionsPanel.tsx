"use client";

import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { usePagePermissions } from "../../hooks/usePagePermissions";

interface PermissionsPanelProps {
  pageId: string;
}

export default function PermissionsPanel({ pageId }: PermissionsPanelProps) {
  const { listPermissions, grantPermission, revokePermission, updatePermissionRole } = usePagePermissions();
  const [permissions, setPermissions] = useState<Array<{ id: string; userId: string; role: string; user?: { name: string; email: string } }>>([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"viewer" | "editor" | "admin">("viewer");

  useEffect(() => {
    const run = async () => {
      const data = await listPermissions(pageId);
      setPermissions(data);
    };

    void run();
  }, [listPermissions, pageId]);

  return (
    <div className="surface-card space-y-4 p-4">
      <h3 className="text-[20px] font-semibold">Permissions</h3>
      <div className="space-y-2">
        {permissions.map((permission) => (
          <div key={permission.id} className="surface-elevated flex items-center justify-between p-2">
            <div>
              <p className="text-[13px] font-semibold">{permission.user?.name ?? permission.userId}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{permission.user?.email ?? "No email"}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={permission.role}
                onChange={async (event) => {
                  const nextRole = event.target.value as "viewer" | "editor" | "admin";
                  await updatePermissionRole(pageId, permission.userId, nextRole);
                  setPermissions((prev) => prev.map((item) => (item.id === permission.id ? { ...item, role: nextRole } : item)));
                }}
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <Button variant="ghost" onClick={async () => {
                await revokePermission(pageId, permission.userId);
                setPermissions((prev) => prev.filter((item) => item.id !== permission.id));
              }}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Input label="Invite user id" value={userId} onChange={(event) => setUserId(event.target.value)} />
        <select value={role} onChange={(event) => setRole(event.target.value as "viewer" | "editor" | "admin")} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2">
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <Button
          className="w-full"
          onClick={async () => {
            if (!userId.trim()) return;
            const created = await grantPermission(pageId, { userId: userId.trim(), role });
            setPermissions((prev) => [...prev, created]);
            setUserId("");
          }}
        >
          Invite
        </Button>
      </div>
    </div>
  );
}
