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

import { describe, expect, it } from 'vitest';

import { buildDashboardDocumentTitle } from './document-title';

describe('buildDashboardDocumentTitle', () => {
  it('includes display name, project, and Perses suffix', () => {
    expect(buildDashboardDocumentTitle('My Dashboard', 'demo')).toBe('My Dashboard · demo | Perses');
  });

  it('omits project when absent', () => {
    expect(buildDashboardDocumentTitle('Home')).toBe('Home | Perses');
    expect(buildDashboardDocumentTitle('Home', '')).toBe('Home | Perses');
    expect(buildDashboardDocumentTitle('Home', '   ')).toBe('Home | Perses');
  });

  it('trims display name and project', () => {
    expect(buildDashboardDocumentTitle('  Overview  ', '  my-project  ')).toBe('Overview · my-project | Perses');
  });

  it('falls back when display name is blank', () => {
    expect(buildDashboardDocumentTitle('', 'demo')).toBe('Dashboard · demo | Perses');
    expect(buildDashboardDocumentTitle('   ')).toBe('Dashboard | Perses');
  });
});
