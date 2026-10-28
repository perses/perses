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

import { getDashboardType } from './dashboard-type';

describe('getDashboardType', () => {
  it('should detect a Perses dashboard', () => {
    expect(getDashboardType({ kind: 'Dashboard', metadata: { name: 'test' }, spec: {} })).toBe('perses');
  });

  it('should detect a Grafana dashboard', () => {
    expect(getDashboardType({ title: 'test', panels: [], templating: { list: [] } })).toBe('grafana');
  });

  it('should detect a Grafana v2 dashboard', () => {
    expect(
      getDashboardType({
        apiVersion: 'dashboard.grafana.app/v2beta1',
        kind: 'Dashboard',
        metadata: { name: 'test' },
        spec: { title: 'test', elements: {}, layout: {} },
      }),
    ).toBe('grafana');
  });
});
