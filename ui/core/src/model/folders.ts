// -----------------------------
// folder.ts
// -----------------------------

import { ProjectMetadata } from './resource';

// --- Types ---
export interface FolderResource {
  kind: 'Folder';
  metadata: ProjectMetadata;
}

export interface FolderSelector {
  project: string;
  folder: string;
}
