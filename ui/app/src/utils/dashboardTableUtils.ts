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

import { FolderResource, FolderSpec, getResourceDisplayName } from '@perses-dev/core';
import { intlFormatDistance } from 'date-fns';
import type { DashboardTreeTableRow } from '../components/DashboardList/DashboardTreeList';
import { DashboardListRow } from '../components/DashboardList/DashboardList';

export interface RowWithOriginal<TData> {
  original: TData;
}

/**
 * Sorting function for string columns of the dashboard tree table.
 *
 * Folders are always sorted before dashboards regardless of sort direction.
 */
export function sortDashboardTableStringColumn(
  rowA: RowWithOriginal<DashboardTreeTableRow>,
  rowB: RowWithOriginal<DashboardTreeTableRow>,
  field: 'displayName' | 'project',
  isDesc: boolean
): number {
  const a = rowA.original;
  const b = rowB.original;
  const kindOrder = compareFolderFirst(a.kind, b.kind, isDesc);
  if (kindOrder !== 0) {
    return kindOrder;
  }
  return a[field].localeCompare(b[field]);
}

/**
 * Formats a date as a human-readable relative time string (e.g. "2 hours ago").
 * Returns `null` if no date is provided.
 */
export function formatRelativeTime(value: Date | undefined): string | null {
  if (!value) return null;
  return intlFormatDistance(value, new Date());
}

/**
 * Formats a date as a UTC string (e.g. for use in tooltips or accessible cell descriptions).
 * Returns an empty string if no date is provided.
 */
export function formatAbsoluteTime(value: Date | undefined): string {
  return value?.toUTCString() ?? '';
}

/**
 * Builds the nested row structure for the dashboard tree table.
 *
 * Folders are mapped to parent rows with their children resolved from `dashboardsMap`.
 * Dashboards that don't belong to any folder are appended at the root level.
 *
 * @param folderList - All folder resources for the current project(s).
 * @param dashboardsMap - A two-level map of `project → (dashboardName → DashboardResource)`.
 * @returns Rows ready to be consumed by `DashboardTreeList`.
 */
export const buildTableRows = (
  folderList: FolderResource[],
  dashboardsMap: Map<string, Map<string, DashboardListRow>>
): DashboardTreeTableRow[] => {
  const dashboardsMapCopy = copyDashboardsMap(dashboardsMap);
  const tableRows = mapToTableData(folderList ?? [], dashboardsMapCopy);
  const items = [...dashboardsMapCopy.values()]
    .flatMap((map) => [...map.values()])
    .filter((dashboard) => !dashboard.inFolder)
    .map((dashboard) => mapToTableRow(dashboard, []));
  return tableRows.concat(items);
};

const copyDashboardsMap = (
  dashboardsMap: Map<string, Map<string, DashboardListRow>>
): Map<string, Map<string, DashboardListRow & { inFolder?: boolean }>> => {
  return new Map(
    [...dashboardsMap.entries()].map(([project, inner]): [string, Map<string, DashboardListRow>] => [
      project,
      new Map(inner),
    ])
  );
};

const mapToTableRow = (dashboardResource: DashboardListRow, path: string[]): DashboardTreeTableRow => {
  const createdAt = dashboardResource.createdAt;
  const updatedAt = dashboardResource.updatedAt;
  const viewedAt = dashboardResource.viewedAt;
  return {
    kind: 'Dashboard',
    name: dashboardResource.name,
    displayName: dashboardResource.displayName,
    createdAt: createdAt ? new Date(createdAt) : undefined,
    updatedAt: updatedAt ? new Date(updatedAt) : undefined,
    tags: dashboardResource.tags,
    version: dashboardResource.version,
    project: dashboardResource.project,
    viewedAt: viewedAt ? new Date(viewedAt) : undefined,
    path: path,
  };
};

const mapToTableData = (
  folderList: FolderResource[],
  dashboardMap: Map<string, Map<string, DashboardListRow>>
): DashboardTreeTableRow[] => {
  return folderList.map((folder) => {
    const project = folder.metadata.project;
    const map = dashboardMap.get(project) ?? new Map<string, DashboardListRow>();
    const rootPath: string[] = [];
    return {
      kind: folder.kind,
      name: folder.metadata.name,
      project: project,
      path: rootPath,
      displayName: getResourceDisplayName(folder),
      tags: folder.metadata.tags,
      version: folder.metadata.version,
      children: mapFolderSpecToTableRow(folder.spec, map, project, buildPath(rootPath, folder.metadata.name)),
    };
  });
};

const mapFolderSpecToTableRow = (
  folderSpec: FolderSpec[],
  dashboardMap: Map<string, DashboardListRow & { inFolder?: boolean }>,
  project: string,
  parentPath: string[]
): DashboardTreeTableRow[] => {
  return folderSpec
    .map((item) => {
      switch (item.kind) {
        case 'Dashboard': {
          const resource = dashboardMap.get(item.name);
          if (resource) {
            dashboardMap.set(item.name, { ...resource, inFolder: true });
            return mapToTableRow(resource, parentPath);
          }
          return undefined;
        }
        case 'Folder':
          return {
            kind: item.kind,
            name: item.name,
            project: project,
            path: parentPath,
            displayName: item.name,
            children: item.spec
              ? mapFolderSpecToTableRow(item.spec, dashboardMap, project, buildPath(parentPath, item.name))
              : undefined,
          };
        default:
          throw new Error(`Unknown kind: ${item.kind}`);
      }
    })
    .filter((row): row is DashboardTreeTableRow => row !== undefined)
    .sort((a, b) => compareFolderFirst(a.kind, b.kind));
};

const buildPath = (parentPath: string[], name: string): string[] => {
  return [...parentPath, name];
};

function compareFolderFirst(kindA: string, kindB: string, isDesc = false): number {
  if (kindA === kindB) return 0;
  const folderFirst = kindA === 'Folder' ? -1 : 1;
  return isDesc ? -folderFirst : folderFirst;
}
