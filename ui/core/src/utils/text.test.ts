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

import { ProjectResource } from '../model';
import { getResourceDisplayName, getResourceExtendedDisplayName } from './text';

const projectWithDisplayName: ProjectResource = {
  kind: 'Project',
  metadata: { name: 'my-project' },
  spec: { display: { name: 'My Project' } },
};

const projectWithoutDisplayName: ProjectResource = {
  kind: 'Project',
  metadata: { name: 'my-project' },
  spec: {},
};

const projectWithoutSpec = {
  kind: 'Project',
  metadata: { name: 'my-project' },
} as unknown as ProjectResource;

describe('getResourceDisplayName', () => {
  test('returns spec.display.name when present', () => {
    expect(getResourceDisplayName(projectWithDisplayName)).toBe('My Project');
  });

  test('falls back to metadata.name when spec.display.name is absent', () => {
    expect(getResourceDisplayName(projectWithoutDisplayName)).toBe('my-project');
  });

  test('falls back to metadata.name when spec is absent', () => {
    expect(getResourceDisplayName(projectWithoutSpec)).toBe('my-project');
  });
});

describe('getResourceExtendedDisplayName', () => {
  test('returns display name with metadata.name in parentheses when display name present', () => {
    expect(getResourceExtendedDisplayName(projectWithDisplayName)).toBe('My Project (ID: my-project)');
  });

  test('falls back to metadata.name when spec.display.name is absent', () => {
    expect(getResourceExtendedDisplayName(projectWithoutDisplayName)).toBe('my-project');
  });

  test('falls back to metadata.name when spec is absent', () => {
    expect(getResourceExtendedDisplayName(projectWithoutSpec)).toBe('my-project');
  });
});
