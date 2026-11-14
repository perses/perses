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

import { fetchJson } from '@perses-dev/client';

import { searchDashboardsByTags } from './search-client';

vi.mock('@perses-dev/client', () => ({
  fetchJson: vi.fn(),
}));

vi.mock('../config', () => ({
  PERSES_APP_CONFIG: { api_prefix: '' },
}));

describe('searchDashboardsByTags', () => {
  it('repeats the tag query parameter and does not send a text query', async () => {
    vi.mocked(fetchJson).mockResolvedValue([]);

    await searchDashboardsByTags('demo', ['api', 'traffic']);

    expect(fetchJson).toHaveBeenCalledWith('/api/v1/search/dashboards?project=demo&tag=api&tag=traffic', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  });
});
