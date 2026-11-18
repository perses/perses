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

import type { FolderItem } from '@perses-dev/client';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VirtuosoMockContext } from 'react-virtuoso';

import { FolderContents } from './FolderContents';

describe('FolderContents integration', () => {
  it('renders folder and dashboard types using the real Table', async () => {
    const items: FolderItem[] = [
      {
        kind: 'Folder',
        name: 'Monitoring',
        items: [],
      },
      {
        kind: 'Dashboard',
        name: 'Cluster Overview',
      },
    ];

    render(
      <VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 50 }}>
        <MemoryRouter>
          <FolderContents
            items={items}
            folderName="Production"
            folderUrl="/projects/mahmoud/folders/root"
            projectName="mahmoud"
          />
        </MemoryRouter>
      </VirtuosoMockContext.Provider>,
    );

    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Type')).toBeTruthy();

    expect(await screen.findByRole('link', { name: 'Monitoring' })).toBeTruthy();

    expect(screen.getByRole('link', { name: 'Cluster Overview' })).toBeTruthy();

    expect(screen.getByText('Folder')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });
});
