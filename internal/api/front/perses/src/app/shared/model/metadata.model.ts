export interface Metadata {
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMetadata extends Metadata {
  project: string;
}
