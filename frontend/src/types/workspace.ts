export interface PagePermission {
  id: string;
  pageId: string;
  userId: string;
  role: "viewer" | "editor" | "admin";
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface WorkspacePage {
  id: string;
  title: string;
  emoji?: string | null;
  coverUrl?: string | null;
  content: unknown;
  contentText?: string | null;
  parentId?: string | null;
  position: number;
  isArchived: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  children?: WorkspacePage[];
  permissions?: PagePermission[];
}

export interface PageComment {
  id: string;
  pageId: string;
  authorId: string;
  parentId?: string | null;
  content: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  replies?: PageComment[];
}

export interface PageTreeNode {
  id: string;
  title: string;
  emoji?: string | null;
  parentId?: string | null;
  position: number;
  children: PageTreeNode[];
}

export interface Viewer {
  userId: string;
  name: string;
  avatarUrl?: string | null;
}

export interface PageSearchResult {
  id: string;
  title: string;
  emoji?: string | null;
  contentText?: string | null;
  parentId?: string | null;
  updatedAt: string;
}

export interface PageFile {
  id: string;
  pageId: string;
  name: string;
  url: string;
  status?: "pending" | "complete";
  size: number;
  mimeType: string;
  uploadedAt: string;
}
