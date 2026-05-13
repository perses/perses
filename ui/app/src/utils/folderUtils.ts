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

import { FolderSpec } from '@perses-dev/core';

/**
 * Returns a new spec array without the `FolderSpec` node identified by `path`.
 *
 * The path is an ordered list of folder names that leads to the target folder,
 * **not including** the root `FolderResource` name.
 *
 * For example, given the tree:
 * ```
 * Root
 * └─ A
 *    └─ B   ← target
 * ```
 * call `withoutSubFolder(root.spec, ['A', 'B'])` to get a copy of the tree without B.
 *
 * The function is **pure**: it returns a new array and does not mutate the input.
 *
 * @param spec  The spec array to operate on (typically `FolderResource.spec`).
 * @param path  Non-empty array of folder names identifying the target sub-folder.
 * @returns     A new spec array with the target sub-folder removed.
 * @throws      If any segment of the path does not resolve to a `Folder` node.
 */
export function withoutSubFolder(spec: FolderSpec[], path: string[]): FolderSpec[] {
  if (path.length === 0) {
    throw new Error('path must not be empty');
  }

  const [head, ...tail] = path;

  if (tail.length === 0) {
    const index = spec.findIndex((s) => s.kind === 'Folder' && s.name === head);
    if (index === -1) {
      throw new Error(`Folder "${head}" not found`);
    }
    return [...spec.slice(0, index), ...spec.slice(index + 1)];
  }

  return spec.map((s) => {
    if (s.kind !== 'Folder' || s.name !== head) {
      return s;
    }
    if (!s.spec) {
      throw new Error(`Folder "${head}" has no children`);
    }
    return { ...s, spec: withoutSubFolder(s.spec, tail) };
  });
}

/**
 * Returns a deep copy of the `FolderSpec` node identified by `path`.
 *
 * The path is an ordered list of folder names that leads to the target folder,
 * **not including** the root `FolderResource` name.
 *
 * For example, given the tree:
 * ```
 * Root
 * └─ A
 *    └─ B   ← target
 * ```
 * call `getSubFolderDeepCopy(root.spec, ['A', 'B'])` to get a deep copy of B.
 *
 * @param spec  The spec array to search (typically `FolderResource.spec`).
 * @param path  Non-empty array of folder names identifying the target sub-folder.
 * @returns     A deep copy of the target `FolderSpec` node.
 * @throws      If any segment of the path does not resolve to a `Folder` node.
 */
export function getSubFolderDeepCopy(spec: FolderSpec[], path: string[]): FolderSpec {
  if (path.length === 0) {
    throw new Error('path must not be empty');
  }

  const [head, ...tail] = path;

  const node = spec.find((s) => s.kind === 'Folder' && s.name === head);
  if (!node) {
    throw new Error(`Folder "${head}" not found`);
  }

  if (tail.length === 0) {
    return structuredClone(node);
  }

  if (!node.spec) {
    throw new Error(`Folder "${head}" has no children`);
  }

  return getSubFolderDeepCopy(node.spec, tail);
}

/**
 * Returns a **live reference** to the `FolderSpec` node identified by `path`.
 * Mutating the returned object will mutate the original `spec` array.
 * Use {@link getSubFolderDeepCopy} when you need an independent copy.
 *
 * The path is an ordered list of folder names that leads to the target folder,
 * **not including** the root `FolderResource` name.
 *
 * For example, given the tree:
 * ```
 * Root
 * └─ A
 *    └─ B   ← target
 * ```
 * call `getSubFolderRef(root.spec, ['A', 'B'])` to get a reference to B.
 *
 * @param spec  The spec array to search (typically `FolderResource.spec`).
 * @param path  Non-empty array of folder names identifying the target sub-folder.
 * @returns     A live reference to the target `FolderSpec` node.
 * @throws      If any segment of the path does not resolve to a `Folder` node.
 */
export function getSubFolderRef(spec: FolderSpec[], path: string[]): FolderSpec {
  if (path.length === 0) {
    throw new Error('path must not be empty');
  }

  const [head, ...tail] = path;

  const node = spec.find((s) => s.kind === 'Folder' && s.name === head);
  if (!node) {
    throw new Error(`Folder "${head}" not found`);
  }

  if (tail.length === 0) {
    return node;
  }

  if (!node.spec) {
    throw new Error(`Folder "${head}" has no children`);
  }

  return getSubFolderRef(node.spec, tail);
}

/**
 * Returns a new spec array with `newFolder` inserted as a child of the folder
 * identified by `parentPath`.
 *
 * When `parentPath` is an empty array the new folder is inserted at the root level.
 *
 * The path is an ordered list of folder names that leads to the **parent** folder,
 * **not including** the root `FolderResource` name.
 *
 * For example, given the tree:
 * ```
 * Root
 * └─ A        ← parent
 *    └─ B
 * ```
 * call `insertSubFolder(root.spec, ['A'], newFolder)` to add `newFolder` alongside B
 * inside A.
 *
 * The function is **pure**: it returns a new array and does not mutate the input.
 *
 * @param spec        The spec array to operate on (typically `FolderResource.spec`).
 * @param parentPath  Ordered folder names leading to the parent folder.
 *                    Pass `[]` to insert at the root level.
 * @param newFolder   The `FolderSpec` node to insert.
 * @returns           A new spec array with `newFolder` inserted.
 * @throws            If any segment of `parentPath` does not resolve to a `Folder` node.
 * @throws            If a sibling with the same name already exists.
 */
export function insertSubFolder(spec: FolderSpec[], parentPath: string[], newFolder: FolderSpec): FolderSpec[] {
  if (parentPath.length === 0) {
    return insertInto(spec, newFolder);
  }

  const [head, ...tail] = parentPath;

  if (!spec.some((s) => s.kind === 'Folder' && s.name === head)) {
    throw new Error(`Folder "${head}" not found`);
  }

  return spec.map((s) => {
    if (s.kind !== 'Folder' || s.name !== head) {
      return s;
    }
    if (tail.length > 0 && !s.spec) {
      throw new Error(`Folder "${head}" has no children`);
    }
    return { ...s, spec: insertSubFolder(s.spec ?? [], tail, newFolder) };
  });
}

const insertInto = (children: FolderSpec[], newFolder: FolderSpec): FolderSpec[] => {
  if (children.some((s) => s.kind === 'Folder' && s.name === newFolder.name)) {
    throw new Error(`Folder "${newFolder.name}" already exists`);
  }
  return [...children, newFolder];
};

/**
 * Returns a new spec array with the `FolderSpec` node identified by `path` replaced by `replacement`.
 *
 * The path is an ordered list of folder names that leads to the target folder,
 * **not including** the root `FolderResource` name.
 *
 * For example, given the tree:
 * ```
 * Root
 * └─ A
 *    └─ B   ← target
 * ```
 * call `replaceSubFolder(root.spec, ['A', 'B'], newB)` to swap B out.
 *
 * The function is **pure**: it returns a new array and does not mutate the input.
 *
 * @param spec         The spec array to operate on (typically `FolderResource.spec`).
 * @param path         Non-empty array of folder names identifying the target sub-folder.
 * @param replacement  The new `FolderSpec` node to put in place of the target.
 * @returns            A new spec array with the target node replaced.
 * @throws             If any segment of the path does not resolve to a `Folder` node.
 */
export function replaceSubFolder(spec: FolderSpec[], path: string[], replacement: FolderSpec): FolderSpec[] {
  if (path.length === 0) {
    throw new Error('path must not be empty');
  }

  const [head, ...tail] = path;

  if (tail.length === 0) {
    const index = spec.findIndex((s) => s.kind === 'Folder' && s.name === head);
    if (index === -1) {
      throw new Error(`Folder "${head}" not found`);
    }
    return [...spec.slice(0, index), replacement, ...spec.slice(index + 1)];
  }

  return spec.map((s) => {
    if (s.kind !== 'Folder' || s.name !== head) {
      return s;
    }
    if (!s.spec) {
      throw new Error(`Folder "${head}" has no children`);
    }
    return { ...s, spec: replaceSubFolder(s.spec, tail, replacement) };
  });
}

/**
 * Collects the names of all dashboards contained within a `FolderSpec` subtree,
 * including those nested inside any sub-folders at any depth.
 *
 * For example, given:
 * ```
 * A
 * ├─ Dashboard: "dash-1"
 * └─ B
 *    └─ Dashboard: "dash-2"
 * ```
 * `collectDashboards(A)` returns `["dash-1", "dash-2"]`.
 *
 * @param folderSpec  The spec array to search. Returns `[]` when `undefined`.
 * @param deep        When `true` (default), recurse into nested sub-folders.
 * @param filter      Optional predicate; only dashboards whose name satisfies
 *                    the predicate are included in the result.
 * @returns           An array of dashboard names found in the subtree.
 */
export function collectDashboards(
  folderSpec: FolderSpec[] | undefined,
  deep: boolean = true,
  filter?: (name: string) => boolean
): string[] {
  if (!folderSpec) {
    return [];
  }

  const dashboards: string[] = [];

  for (const item of folderSpec) {
    if (item.kind === 'Dashboard' && (!filter || filter(item.name))) {
      dashboards.push(item.name);
    } else if (item.kind === 'Folder' && deep) {
      dashboards.push(...collectDashboards(item.spec, deep, filter));
    }
  }

  return dashboards;
}
