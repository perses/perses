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

jest.mock('../../context/Authorization', () => ({
  useAuthorizationContext: (): { username: string } => ({
    username: 'admin',
  }),
}));

const permissionMockData: Record<string, Array<{ actions: string[]; scopes: string[] }>> = {
  '*': [{ actions: ['read'], scopes: ['*'] }],
  project1: [
    { actions: ['read'], scopes: ['*'] },
    { actions: ['create', 'update'], scopes: ['Dashboard'] },
    { actions: ['create', 'update', 'read'], scopes: ['Folder'] },
  ],
  project2: [
    { actions: ['read', '*'], scopes: ['*'] },
    { actions: ['update', 'create'], scopes: ['Folder'] },
  ],
};

jest.mock('../../model/user-client', () => ({
  useUserPermissions: (): { data: Record<string, object[]> } => ({
    data: permissionMockData,
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
  it('renders the ProfileView', async () => {
    ['profile-section-container', 'profile-view-container', 'profile-sidebar'].forEach((testId) => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('permissions-container')).toBeInTheDocument();
    });
  });
});

describe('Permissions rendering', () => {
  describe('Accordions', () => {
    it('should render all Accordions', () => {
      const keys = Object.keys(permissionMockData);
      keys.forEach((k) => {
        expect(screen.getByTestId(`${k}-according`)).toBeInTheDocument();
      });
    });
  });

  describe('Table of permissions', () => {
    describe('Rendered rows', () => {
      it('should render rows after removing redundant items', () => {
        expect(screen.getByTestId('*-permission-0')).toBeInTheDocument();
        expect(screen.getByTestId('project1-permission-0')).toBeInTheDocument();
        expect(screen.getByTestId('project1-permission-1')).toBeInTheDocument();
        expect(screen.getByTestId('project1-permission-2')).toBeInTheDocument();
        expect(screen.getByTestId('project2-permission-0')).toBeInTheDocument();
        expect(screen.queryByTestId('project2-permission-1')).toBeNull();
      });
    });

    describe('Rendered chips', () => {
      it('should render chips with actions and scopes', () => {
        expect(screen.getByTestId('*-permission-0-action-read')).toBeInTheDocument();
        expect(screen.getByTestId('*-permission-0-scope-all')).toBeInTheDocument();

        expect(screen.getByTestId('project1-permission-0-action-read')).toBeInTheDocument();
        expect(screen.getByTestId('project1-permission-0-scope-all')).toBeInTheDocument();

        expect(screen.getByTestId('project1-permission-1-action-create')).toBeInTheDocument();
        expect(screen.getByTestId('project1-permission-1-action-update')).toBeInTheDocument();
        expect(screen.getByTestId('project1-permission-1-scope-Dashboard')).toBeInTheDocument();

        expect(screen.getByTestId('project1-permission-2-action-create')).toBeInTheDocument();
        expect(screen.getByTestId('project1-permission-2-action-update')).toBeInTheDocument();
        expect(screen.queryByTestId('project1-permission-2-action-read')).toBeNull();
        expect(screen.getByTestId('project1-permission-2-scope-Folder')).toBeInTheDocument();

        expect(screen.getByTestId('project2-permission-0-action-all')).toBeInTheDocument();
        expect(screen.getByTestId('project2-permission-0-scope-all')).toBeInTheDocument();
        expect(screen.queryByTestId('project2-permission-0-action-read')).toBeNull();

        expect(screen.queryByTestId('project2-permission-1-action-update')).toBeNull();
        expect(screen.queryByTestId('project2-permission-1-action-create')).toBeNull();
        expect(screen.queryByTestId('project2-permission-1-scope-Folder')).toBeNull();
      });
    });
  });
});
