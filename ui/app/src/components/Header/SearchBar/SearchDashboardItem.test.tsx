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

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { getTagDisplayValues } from './model';
import { SearchDashboardItem } from './SearchDashboardItem';
import { DASHBOARDS_RESOURCES } from './test_mock_data';

describe('SearchDashboardItem', () => {
  it('renders visible tags and the +N chip for hidden tags', () => {
    const tags = ['backend', 'prod', 'infra', 'frontend', 'ops'];

    const tagsDisplayValue = getTagDisplayValues(tags, ['infra', 'prod']);

    render(
      <MemoryRouter>
        <SearchDashboardItem
          resource={{
            ...DASHBOARDS_RESOURCES[0]!,
            highlight: false,
          }}
          matchingResult={[]}
          tagsDisplayValue={tagsDisplayValue}
          handleClose={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('prod')).toBeInTheDocument();
    expect(screen.getByText('infra')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();

    expect(screen.getByText('+2')).toBeInTheDocument();

    expect(screen.queryByText('frontend')).not.toBeInTheDocument();
    expect(screen.queryByText('ops')).not.toBeInTheDocument();
  });
});
