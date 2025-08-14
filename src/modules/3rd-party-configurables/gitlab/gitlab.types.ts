export type GitlabMetadata = {
  webhookSecret: string;
  projects?: Array<{ id: number; path_with_namespace: string }>;
};

export type GitlabProject = {
  id: number;
  name: string;
  path_with_namespace: string;
  visibility: "private" | "internal" | "public";
};

export type SaveProjectsRequest = Array<{
  id: number;
  name: string;
  path_with_namespace: string;
}>;
