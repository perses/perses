import { Hidden } from '@material-ui/core';
import { Box } from '@material-ui/system';
import { DashboardResource } from '@perses-ui/core';
import Dashboard from '../../components/Dashboard';
import { DashboardContextProvider } from '../../context/dashboard';
import OptionsDrawer from './OptionsDrawer';

export interface DashboardViewProps {
  resource: DashboardResource;
}

/**
 * The View for viewing a Dashboard.
 */
function DashboardView(props: DashboardViewProps) {
  const { resource } = props;
  return (
    <DashboardContextProvider resource={resource}>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ padding: (theme) => theme.spacing(1, 2), flexGrow: 1 }}>
          <Dashboard />
        </Box>
        <Hidden mdDown>
          <OptionsDrawer />
        </Hidden>
      </Box>
    </DashboardContextProvider>
  );
}

export default DashboardView;
