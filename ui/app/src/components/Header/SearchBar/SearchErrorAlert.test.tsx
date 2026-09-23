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

import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { StatusError } from '@perses-dev/client';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';

import { SearchErrorAlert } from './SearchErrorAlert';

const theme = createTheme();

describe('SearchErrorAlert', () => {
  it('shows a shared error alert when a resource list fails to load', () => {
    render(
      <ThemeProvider theme={theme}>
        <SearchErrorAlert
          title="Failed to load projects"
          error={{ message: 'network down', status: 500 } as StatusError}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Failed to load projects: network down')).toBeInTheDocument();
  });

  it('does not leak RBAC scope names when a list request is forbidden', () => {
    render(
      <ThemeProvider theme={theme}>
        <SearchErrorAlert
          title="Failed to load global datasources"
          error={
            {
              message: "forbidden access: missing 'read' global permission for 'GlobalDatasource' kind",
              status: 403,
            } as StatusError
          }
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByText('Failed to load global datasources: you do not have permission to view this'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/GlobalDatasource/)).not.toBeInTheDocument();
  });

  it('uses a fallback message when the API error is empty', () => {
    render(
      <ThemeProvider theme={theme}>
        <SearchErrorAlert title="Failed to load projects" error={{ message: '  ', status: 500 } as StatusError} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Failed to load projects: Unknown error')).toBeInTheDocument();
  });
});
