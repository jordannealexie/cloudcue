"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import type { ApiResponse } from "../../types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: "admin" | "member" | "viewer";
  projectCount: number;
  joinedAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: "admin" | "member" | "viewer";
  status: "pending" | "revoked";
  sentAt: string;
  revokedAt?: string | null;
}

const formatDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteValue, setInviteValue] = useState("");
  const [inviteRole, setInviteRole] = useState<PendingInvite["role"]>("member");
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    const run = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        const [membersResponse, invitesResponse] = await Promise.all([
          apiClient.get<ApiResponse<TeamMember[]>>("/team/members"),
          apiClient.get<ApiResponse<PendingInvite[]>>("/team/invites")
        ]);
        setMembers(membersResponse.data.data);
        setPendingInvites(invitesResponse.data.data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, "Unable to load team members"));
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const totalProjects = useMemo(
    () => members.reduce((total, member) => total + member.projectCount, 0),
    [members]
  );

  const sendInvite = (): void => {
    const emails = inviteValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const run = async () => {
      try {
        setIsSendingInvite(true);
        const response = await apiClient.post<ApiResponse<PendingInvite[]>>("/team/invites", {
          emails,
          role: inviteRole
        });
        setPendingInvites((current) => [...response.data.data, ...current]);
        setInviteMessage(`Invites sent to ${emails.length} teammate${emails.length > 1 ? "s" : ""}.`);
        setError(null);
        setInviteValue("");
        setInviteRole("member");
        setInviteOpen(false);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to send invites"));
      } finally {
        setIsSendingInvite(false);
      }
    };

    void run();
  };

  const updateRole = (memberId: string, role: TeamMember["role"]): void => {
    const run = async () => {
      try {
        const response = await apiClient.patch<ApiResponse<TeamMember[]>>(`/team/members/${memberId}/role`, { role });
        setMembers(response.data.data);
        setInviteMessage("Member role updated.");
        setError(null);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to update role"));
      }
    };

    void run();
  };

  const resendInvite = (inviteId: string): void => {
    const run = async () => {
      try {
        const response = await apiClient.post<ApiResponse<PendingInvite>>(`/team/invites/${inviteId}/resend`);
        setPendingInvites((current) =>
          current.map((invite) => (invite.id === inviteId ? response.data.data : invite))
        );
        setInviteMessage("Invite resent.");
        setError(null);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to resend invite"));
      }
    };

    void run();
  };

  const revokeInvite = (inviteId: string): void => {
    const run = async () => {
      try {
        const response = await apiClient.post<ApiResponse<PendingInvite>>(`/team/invites/${inviteId}/revoke`);
        setPendingInvites((current) =>
          current.map((invite) => (invite.id === inviteId ? response.data.data : invite))
        );
        setInviteMessage("Invite revoked.");
        setError(null);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to revoke invite"));
      }
    };

    void run();
  };

  return (
    <PageWrapper>
      <Topbar />

      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[28px] font-bold">Team</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Everyone in your CloudCue workspace.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Invite teammate</Button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <article className="surface-card p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Members</p>
          <p className="text-[28px] font-bold">{members.length}</p>
        </article>
        <article className="surface-card p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Pending invites</p>
          <p className="text-[28px] font-bold">{pendingInvites.length}</p>
        </article>
        <article className="surface-card p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Project assignments</p>
          <p className="text-[28px] font-bold">{totalProjects}</p>
        </article>
      </div>

      {error ? <div className="surface-card mb-4 p-4 text-[var(--blush)]">{error}</div> : null}
      {inviteMessage ? <div className="surface-card mb-4 p-4 text-[var(--text-secondary)]">{inviteMessage}</div> : null}

      <section className="surface-card overflow-x-auto p-2">
        <table className="min-w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <th className="px-3 py-2 font-medium">Member</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Projects</th>
              <th className="px-3 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-3 py-4 text-[var(--text-secondary)]" colSpan={4}>
                  Loading members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-[var(--text-secondary)]" colSpan={4}>
                  No team members found.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-b border-[var(--border-subtle)]">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={member.name} src={member.avatarUrl} size="sm" />
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-[12px] text-[var(--text-secondary)]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Badge>{member.role}</Badge>
                      <select
                        value={member.role}
                        onChange={(event) => updateRole(member.id, event.target.value as TeamMember["role"])}
                        className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 text-[12px]"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-3">{member.projectCount}</td>
                  <td className="px-3 py-3">{formatDate(member.joinedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="surface-card mt-4 p-4">
        <h2 className="mb-2 text-[18px] font-semibold">Pending invites</h2>
        {pendingInvites.length === 0 ? (
          <p className="text-[13px] text-[var(--text-secondary)]">No pending invites.</p>
        ) : (
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="surface-elevated flex items-center justify-between p-3">
                <div>
                  <p className="text-[13px] font-medium">{invite.email}</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    {invite.role} · {invite.status} · sent {formatDate(invite.sentAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{invite.role}</Badge>
                  {invite.status === "pending" ? (
                    <>
                      <Button variant="ghost" onClick={() => resendInvite(invite.id)}>
                        Resend
                      </Button>
                      <Button variant="ghost" onClick={() => revokeInvite(invite.id)}>
                        Revoke
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite to CloudCue">
        <div className="space-y-4">
          <Input
            label="Email addresses"
            placeholder="jane@company.com, james@company.com"
            value={inviteValue}
            onChange={(event) => setInviteValue(event.target.value)}
          />
          <p className="text-[12px] text-[var(--text-secondary)]">Separate multiple emails with commas.</p>

          <div>
            <p className="mb-2 text-[12px] text-[var(--text-secondary)]">Role</p>
            <div className="flex gap-2">
              {(["admin", "member", "viewer"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setInviteRole(role)}
                  className={`rounded-full border px-3 py-1 text-[12px] ${
                    inviteRole === role
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  {role === "admin" ? "Admin" : role === "member" ? "Member" : "Viewer"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[var(--text-secondary)]">
              {inviteRole === "admin"
                ? "Admin can manage workspace and members."
                : inviteRole === "member"
                  ? "Member can create and edit projects and pages."
                  : "Viewer can only view shared content."}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvite} disabled={!inviteValue.trim()} isLoading={isSendingInvite}>
              Send invites
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
