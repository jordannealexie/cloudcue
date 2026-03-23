"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Avatar from "../../components/ui/Avatar";
import { useAuth } from "../../hooks/useAuth";
import { apiClient, getApiErrorMessage } from "../../lib/apiClient";
import { useTheme } from "../../hooks/useTheme";
import { uploadAvatarWithPresign } from "../../lib/uploadFile";

type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "appearance"
  | "workspace"
  | "members"
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
  fontFamily: string;
  allowMemberInvites: boolean;
}

const FONT_OPTIONS = [
  { label: "System UI", value: "Inter, system-ui, sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, sans-serif" },
  { label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: "Avenir", value: "Avenir, 'Avenir Next', sans-serif" },
  { label: "Fira Sans", value: "'Fira Sans', 'Segoe UI', sans-serif" },
  { label: "IBM Plex Sans", value: "'IBM Plex Sans', 'Segoe UI', sans-serif" },
  { label: "Source Sans", value: "'Source Sans 3', 'Segoe UI', sans-serif" },
  { label: "Nunito", value: "Nunito, 'Segoe UI', sans-serif" },
  { label: "Poppins", value: "Poppins, 'Segoe UI', sans-serif" },
  { label: "Manrope", value: "Manrope, 'Segoe UI', sans-serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "Lora", value: "Lora, Georgia, serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "DM Mono", value: "'DM Mono', 'Courier New', monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', 'SFMono-Regular', monospace" },
  { label: "IBM Plex Mono", value: "'IBM Plex Mono', 'Courier New', monospace" }
];

interface UserSession {
  id: string;
  createdAt: string;
  expiresAt: string;
}

interface SettingsToggleProps {
  checked: boolean;
  ariaLabel: string;
  onToggle: () => void;
}

function SettingsToggle({ checked, ariaLabel, onToggle }: SettingsToggleProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border p-1 transition ${
        checked
          ? "border-[var(--accent)] bg-[var(--accent)]"
          : "border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-card-2)_72%,#A4AEB9)]"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-[var(--bg-card)] shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
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
  fontFamily: "Inter, system-ui, sans-serif",
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [draftFontFamily, setDraftFontFamily] = useState(defaultPreferences.fontFamily);
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

        setPreferences({ ...defaultPreferences, ...preferencesResponse.data.data });
        setDraftFontFamily(preferencesResponse.data.data.fontFamily ?? defaultPreferences.fontFamily);
        setSessions(sessionsResponse.data.data);
      } catch (error) {
        setPreferences(defaultPreferences);
        setDraftFontFamily(defaultPreferences.fontFamily);
        setSessions([]);
        setSecurityMessage(getApiErrorMessage(error, "Unable to load security settings"));
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const activeFont = preferences.fontFamily || "Inter, system-ui, sans-serif";
    document.documentElement.style.setProperty("--app-font-family", activeFont);
    window.localStorage.setItem("cloudcue:fontFamily", activeFont);
  }, [preferences.fontFamily]);

  useEffect(() => {
    setDraftFontFamily(preferences.fontFamily || defaultPreferences.fontFamily);
  }, [preferences.fontFamily]);

  const tabs = useMemo(
    () => [
      { key: "profile", label: "Profile" },
      { key: "security", label: "Password & security" },
      { key: "notifications", label: "Notification preferences" },
      { key: "appearance", label: "Appearance" },
      { key: "workspace", label: "Workspace" },
      { key: "members", label: "Members & roles" },
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

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setProfileMessage("Profile photo must be jpg, png, webp, or gif.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage("Profile photo must be 5MB or smaller.");
      return;
    }

    try {
      setUploadingAvatar(true);
      setProfileMessage(null);
      const uploaded = await uploadAvatarWithPresign(file);
      setAvatarUrl(uploaded.fileUrl);
      setProfileMessage("Profile photo uploaded. Save changes to apply it.");
    } catch (error) {
      setProfileMessage(getApiErrorMessage(error, "Unable to upload profile photo"));
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
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
              <div className="surface-elevated flex items-center gap-3 p-3">
                <Avatar name={name || user?.name || "User"} src={avatarUrl || user?.avatarUrl} size="md" />
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold">Profile photo</p>
                  <label className="inline-flex cursor-pointer items-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[12px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-card-2)]">
                    {uploadingAvatar ? "Uploading..." : "Upload photo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void handleAvatarChange(event)} className="hidden" />
                  </label>
                </div>
              </div>
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
                  <div key={item.key} className="surface-elevated flex items-center justify-between p-3 text-[13px]">
                    <span>{item.label}</span>
                    <SettingsToggle
                      checked={preferences[item.key as keyof UserPreferences] as boolean}
                      ariaLabel={`Toggle ${item.label}`}
                      onToggle={() =>
                        void savePreferences({
                          [item.key]: !(preferences[item.key as keyof UserPreferences] as boolean)
                        } as Partial<UserPreferences>)
                      }
                    />
                  </div>
                ))}
              </div>
              {preferencesMessage ? <p className="text-[12px] text-[var(--text-secondary)]">{preferencesMessage}</p> : null}
              <Button
                variant="secondary"
                onClick={() =>
                  void savePreferences({
                    notifyTaskAssigned: preferences.notifyTaskAssigned,
                    notifyTaskOverdue: preferences.notifyTaskOverdue,
                    notifyTaskComment: preferences.notifyTaskComment,
                    notifyMention: preferences.notifyMention,
                    emailWeeklyDigest: preferences.emailWeeklyDigest
                  })
                }
              >
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
              <div className="surface-elevated p-3">
                <label className="mb-2 block text-[12px] font-semibold">Font family</label>
                <select
                  value={draftFontFamily}
                  onChange={(event) => setDraftFontFamily(event.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] px-3 text-[13px]"
                  style={{ fontFamily: draftFontFamily }}
                >
                  {FONT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={{ fontFamily: option.value }}>
                      {option.label} - Aa Bb Cc
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      document.documentElement.style.setProperty("--app-font-family", draftFontFamily);
                      window.localStorage.setItem("cloudcue:fontFamily", draftFontFamily);
                      void savePreferences({ fontFamily: draftFontFamily });
                    }}
                  >
                    Apply font
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDraftFontFamily(defaultPreferences.fontFamily);
                      document.documentElement.style.setProperty("--app-font-family", defaultPreferences.fontFamily);
                      window.localStorage.setItem("cloudcue:fontFamily", defaultPreferences.fontFamily);
                      void savePreferences({ fontFamily: defaultPreferences.fontFamily });
                    }}
                  >
                    Reset
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-[var(--text-secondary)]">Applied across dashboard, workspace, and editor text.</p>
              </div>
            </div>
          ) : null}

          {tab === "workspace" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Workspace Settings</h2>
              <Input label="Workspace name" value="CloudCue Workspace" readOnly />
              <div className="surface-elevated flex items-center justify-between p-3 text-[13px]">
                <span>Allow members to invite others</span>
                <SettingsToggle
                  checked={preferences.allowMemberInvites}
                  ariaLabel="Toggle member invites"
                  onToggle={() => void savePreferences({ allowMemberInvites: !preferences.allowMemberInvites })}
                />
              </div>
            </div>
          ) : null}

          {tab === "members" ? (
            <div className="space-y-4">
              <h2 className="text-[20px] font-semibold">Members & Roles</h2>
              <p className="text-[13px] text-[var(--text-secondary)]">Manage workspace roles from the Team page.</p>
              <Button variant="secondary" onClick={() => window.location.assign("/team")}>Open team page</Button>
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
