"use client";

import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import { useTheme } from "../../hooks/useTheme";

type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "appearance"
  | "workspace"
  | "members"
  | "billing"
  | "integrations";

interface UserPreferences {
  notifyTaskAssigned: boolean;
  notifyTaskOverdue: boolean;
  notifyTaskComment: boolean;
  notifyMention: boolean;
  emailWeeklyDigest: boolean;
  theme: "light" | "dark" | "system";
  sidebarMode: "full" | "compact";
  editorWidth: "narrow" | "medium" | "full";
  fontSize: "small" | "default" | "large";
  allowMemberInvites: boolean;
}

interface UserSession {
  id: string;
  createdAt: string;
  expiresAt: string;
}

const defaultPreferences: UserPreferences = {
  notifyTaskAssigned: true,
  notifyTaskOverdue: true,
  notifyTaskComment: true,
  notifyMention: true,
  emailWeeklyDigest: false,
  theme: "system",
  sidebarMode: "full",
  editorWidth: "medium",
  fontSize: "default",
  allowMemberInvites: true
};

export default function SettingsPage() {
  const { user, me } = useAuth();
  const { resolvedTheme, setMode } = useTheme();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const [preferencesResponse, sessionsResponse] = await Promise.all([
          apiClient.get<{ data: UserPreferences }>("/users/preferences"),
          apiClient.get<{ data: UserSession[] }>("/users/sessions")
        ]);

        setPreferences(preferencesResponse.data.data);
        setSessions(sessionsResponse.data.data);
      } catch (error) {
        setPreferences(defaultPreferences);
        setSessions([]);
        setSecurityMessage(getApiErrorMessage(error, "Unable to load security settings"));
      }
    };

    void run();
  }, []);

  const tabs = useMemo(
    () => [
      { key: "profile", label: "Profile" },
      { key: "security", label: "Password & security" },
      { key: "notifications", label: "Notification preferences" },
      { key: "appearance", label: "Appearance" },
      { key: "workspace", label: "Workspace" },
      { key: "members", label: "Members & roles" },
      { key: "billing", label: "Billing & plan" },
      { key: "integrations", label: "Integrations" }
    ] as Array<{ key: SettingsTab; label: string }>,
    []
  );

  const saveProfile = async (): Promise<void> => {
    try {
      setSavingProfile(true);
      setProfileMessage(null);
      await apiClient.patch("/users/me", {
        name,
        avatarUrl: avatarUrl.trim() ? avatarUrl : null
      });
      await me();
      setProfileMessage("Profile updated");
    } catch (error) {
      setProfileMessage(getApiErrorMessage(error, "Unable to update profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async (next: Partial<UserPreferences>): Promise<void> => {
    try {
      setPreferencesMessage(null);
      const merged = { ...preferences, ...next };
      setPreferences(merged);
      await apiClient.patch("/users/preferences", next);
      setPreferencesMessage("Preferences updated");
    } catch (error) {
      setPreferencesMessage(getApiErrorMessage(error, "Unable to save preferences"));
    }
  };

  const changePassword = async (): Promise<void> => {
    try {
      setChangingPassword(true);
      setSecurityMessage(null);
      await apiClient.patch("/users/password", {
        currentPassword,
        newPassword,
        confirmPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSessions([]);
      setSecurityMessage("Password updated. Sessions were revoked for security.");
    } catch (requestError) {
      setSecurityMessage(getApiErrorMessage(requestError, "Unable to update password"));
    } finally {
      setChangingPassword(false);
    }
  };

  const refreshSessions = async (): Promise<void> => {
    try {
      const response = await apiClient.get<{ data: UserSession[] }>("/users/sessions");
      setSessions(response.data.data);
    } catch (error) {
      setSessions([]);
      setSecurityMessage(getApiErrorMessage(error, "Unable to refresh sessions"));
    }
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    try {
      await apiClient.post(`/users/sessions/${sessionId}/revoke`);
      await refreshSessions();
      setSecurityMessage("Session revoked");
    } catch (error) {
      setSecurityMessage(getApiErrorMessage(error, "Unable to revoke session"));
    }
  };

  const revokeAllSessions = async (): Promise<void> => {
    try {
      await apiClient.post("/users/sessions/revoke-all");
      await refreshSessions();
      setSecurityMessage("All sessions revoked");
    } catch (error) {
      setSecurityMessage(getApiErrorMessage(error, "Unable to revoke sessions"));
    }
  };

  return (
    <PageWrapper>
      <Topbar />

      <div className="mb-4">
        <h1 className="text-[28px] font-bold">Settings</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="surface-card p-3">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Account</p>
          <nav className="space-y-2">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-[13px] ${
                  tab === item.key
                    ? "bg-[var(--accent)] text-[var(--accent-text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-2)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="surface-card p-4">
          {tab === "profile" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">My Profile</h2>
              <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input label="Avatar URL" value={avatarUrl ?? ""} onChange={(event) => setAvatarUrl(event.target.value)} />
              <Input label="Email" value={user?.email ?? ""} readOnly />
              {profileMessage ? <p className="text-[12px] text-[var(--text-secondary)]">{profileMessage}</p> : null}
              <Button onClick={() => void saveProfile()} isLoading={savingProfile}>
                Save changes
              </Button>
            </div>
          ) : null}

          {tab === "security" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Password & Security</h2>
              <div className="surface-elevated space-y-2 p-3">
                <Input
                  label="Current password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
                <Input
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <Button onClick={() => void changePassword()} isLoading={changingPassword}>
                  Update password
                </Button>
              </div>

              <div className="surface-elevated p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold">Active sessions</p>
                  <Button variant="ghost" onClick={() => void refreshSessions()}>
                    Refresh
                  </Button>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-secondary)]">No active sessions found.</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] p-2">
                        <div>
                          <p className="text-[12px]">Created: {new Date(session.createdAt).toLocaleString()}</p>
                          <p className="text-[11px] text-[var(--text-secondary)]">Expires: {new Date(session.expiresAt).toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" onClick={() => void revokeSession(session.id)}>
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <Button variant="danger" onClick={() => void revokeAllSessions()}>
                    Revoke all sessions
                  </Button>
                </div>
              </div>

              {securityMessage ? <p className="text-[12px] text-[var(--text-secondary)]">{securityMessage}</p> : null}
            </div>
          ) : null}

          {tab === "notifications" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Notification Preferences</h2>
              <p className="text-[13px] text-[var(--text-secondary)]">
                Choose how you want to be notified for project and workspace activity.
              </p>
              <div className="grid gap-2">
                {[
                  { label: "Task assigned to me", key: "notifyTaskAssigned" },
                  { label: "Task is overdue", key: "notifyTaskOverdue" },
                  { label: "Someone comments on my task", key: "notifyTaskComment" },
                  { label: "Someone mentions me", key: "notifyMention" },
                  { label: "Weekly email digest", key: "emailWeeklyDigest" }
                ].map((item) => (
                  <label key={item.key} className="surface-elevated flex items-center justify-between p-3 text-[13px]">
                    {item.label}
                    <input
                      type="checkbox"
                      checked={preferences[item.key as keyof UserPreferences] as boolean}
                      onChange={(event) =>
                        void savePreferences({
                          [item.key]: event.target.checked
                        } as Partial<UserPreferences>)
                      }
                    />
                  </label>
                ))}
              </div>
              {preferencesMessage ? <p className="text-[12px] text-[var(--text-secondary)]">{preferencesMessage}</p> : null}
              <Button variant="secondary" onClick={() => void savePreferences(preferences)}>
                Save preferences
              </Button>
            </div>
          ) : null}

          {tab === "appearance" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Appearance</h2>
              <div className="flex gap-2">
                <Button
                  variant={resolvedTheme === "light" ? "primary" : "secondary"}
                  onClick={() => {
                    setMode("light");
                    void savePreferences({ theme: "light" });
                  }}
                >
                  Light
                </Button>
                <Button
                  variant={resolvedTheme === "dark" ? "primary" : "secondary"}
                  onClick={() => {
                    setMode("dark");
                    void savePreferences({ theme: "dark" });
                  }}
                >
                  Dark
                </Button>
                <Button
                  variant={resolvedTheme === "system" ? "primary" : "secondary"}
                  onClick={() => {
                    setMode("system");
                    void savePreferences({ theme: "system" });
                  }}
                >
                  System
                </Button>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)]">Theme preference is stored to your profile.</p>
            </div>
          ) : null}

          {tab === "workspace" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Workspace Settings</h2>
              <Input label="Workspace name" value="CloudCue Workspace" readOnly />
              <label className="surface-elevated flex items-center justify-between p-3 text-[13px]">
                Allow members to invite others
                <input
                  type="checkbox"
                  checked={preferences.allowMemberInvites}
                  onChange={(event) => void savePreferences({ allowMemberInvites: event.target.checked })}
                />
              </label>
            </div>
          ) : null}

          {tab === "members" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Members & Roles</h2>
              <p className="text-[13px] text-[var(--text-secondary)]">Manage workspace roles from the Team page.</p>
              <Button variant="secondary" onClick={() => window.location.assign("/team")}>Open team page</Button>
            </div>
          ) : null}

          {tab === "billing" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Billing & Plan</h2>
              <div className="surface-elevated p-3">
                <p className="text-[13px] font-semibold">Current plan: Pro</p>
                <p className="text-[12px] text-[var(--text-secondary)]">Billing details can be connected to your payment provider in the next step.</p>
              </div>
            </div>
          ) : null}

          {tab === "integrations" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Integrations</h2>
              <div className="surface-elevated p-3">
                <p className="text-[13px] font-semibold">Connected tools</p>
                <p className="text-[12px] text-[var(--text-secondary)]">Google, Slack, and GitHub connection flows can be added here.</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </PageWrapper>
  );
}
