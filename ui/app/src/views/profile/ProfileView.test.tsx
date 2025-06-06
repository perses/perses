import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileView from './ProfileView';
import { ThemeProvider, createTheme } from '@mui/material/styles';

jest.mock('../../model/auth-client', () => ({
  useAuthToken: () => ({
    data: { sub: 'test-user' },
  }),
}));

jest.mock('../../model/user-client', () => ({
  useUserPermissions: () => ({
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
