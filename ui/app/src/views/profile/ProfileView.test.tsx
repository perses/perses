// Copyright 2023 The Perses Authors
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

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProfileView from './ProfileView';

jest.mock('../../model/auth-client', () => ({
  useAuthToken: (): { data: { sub: string } } => ({
    data: { sub: 'test-user' },
  }),
}));

jest.mock('../../model/user-client', () => ({
  useUserPermissions: (): { data: Record<string, object[]> } => ({
    data: { '*': [{ actions: ['create', 'update', 'delete', '*'], scopes: ['project', 'dashboard'] }] },
  }),
}));

beforeEach(() => {
  const theme = createTheme();
  render(
    <ThemeProvider theme={theme}>
      <ProfileView />
    </ThemeProvider>
  );
});

describe('ProfileView', () => {
  it('renders the ProfileView', () => {
    ['profile-section-container', 'profile-view-container', 'profile-sidebar'].forEach((testId) => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  it('renders the permissions and roles by default', async () => {
    await waitFor(() => {
      expect(screen.getByTestId('permissions-container')).toBeInTheDocument();
    });
  });

  it('renders a hierarchal structure for showing permissions and roles', async () => {
    await waitFor(() => {
      ['*-according', '*-subgroup-0'].forEach((testId) => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });
    });
  });

  it('renders the chip actions', async () => {
    await waitFor(() => {
      ['create', 'update', 'delete'].forEach((a) => {
        expect(screen.getByTestId(`chip-action-${a}`)).toBeInTheDocument();
      });
    });
  });

  it('renders the chip scopes', async () => {
    await waitFor(() => {
      ['project', 'dashboard'].forEach((s) => {
        expect(screen.getByTestId(`chip-scope-${s}`)).toBeInTheDocument();
      });
    });
  });
});
