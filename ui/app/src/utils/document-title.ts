// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Browser tab title for a dashboard view (Grafana-style multi-tab UX).
 * Prefer display name; fall back to metadata name at the call site.
 */
export function buildDashboardDocumentTitle(displayName: string, projectName?: string): string {
  const name = displayName.trim() || 'Dashboard';
  const project = projectName?.trim();
  return project ? `${name} · ${project} | Perses` : `${name} | Perses`;
}
