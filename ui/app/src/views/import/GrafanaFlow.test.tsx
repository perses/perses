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

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GrafanaFlow from './GrafanaFlow';

const migrateMock = jest.fn();

jest.mock('../../model/migrate-client', () => ({
  useMigrate: (): object => ({
    mutate: migrateMock,
    isPending: false,
    isError: false,
    isSuccess: false,
    data: undefined,
    error: undefined,
  }),
}));

jest.mock('../../model/project-client', () => ({
  useProjectList: (): object => ({ data: [], isLoading: false, error: null }),
}));

jest.mock('../../model/dashboard-client', () => ({
  useCreateDashboardMutation: (): object => ({ mutate: jest.fn(), isPending: false, isError: false }),
}));

jest.mock('../../context/Config', () => ({
  useIsReadonly: (): boolean => false,
}));

jest.mock('@perses-dev/components', () => ({
  useSnackbar: (): object => ({ exceptionSnackbar: jest.fn() }),
  JSONEditor: (): null => null,
}));

jest.mock('react-router-dom', () => ({
  useNavigate: (): (() => void) => jest.fn(),
}));

function renderFlow(): void {
  render(
    <ThemeProvider theme={createTheme()}>
      <GrafanaFlow dashboard={{ title: 'My Dashboard' }} />
    </ThemeProvider>
  );
}

describe('GrafanaFlow', () => {
  beforeEach(() => {
    migrateMock.mockClear();
  });

  it('renders the "Generate dashboard name from title" checkbox, unchecked by default', () => {
    renderFlow();
    const checkbox = screen.getByLabelText('Generate dashboard name from title') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
  });

  it('does not set generateDashboardName when the checkbox is left unchecked', () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: /migrate/i }));
    expect(migrateMock).toHaveBeenCalledWith(expect.objectContaining({ generateDashboardName: false }));
  });

  it('sets generateDashboardName to true once the checkbox is checked', () => {
    renderFlow();
    fireEvent.click(screen.getByLabelText('Generate dashboard name from title'));
    fireEvent.click(screen.getByRole('button', { name: /migrate/i }));
    expect(migrateMock).toHaveBeenCalledWith(expect.objectContaining({ generateDashboardName: true }));
  });
});
