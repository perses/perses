import { Box, BoxProps } from '@material-ui/core';
import { useDashboardSpec } from '@perses-ui/core';
import AlertErrorBoundary from './AlertErrorBoundary';
import ContentRefResolver from './ContentRefResolver';

export type DashboardProps = BoxProps;

/**
 * Renders a Dashboard for the current Dashboard spec.
 */
function Dashboard(props: DashboardProps) {
  const spec = useDashboardSpec();

  return (
    <Box {...props}>
      <AlertErrorBoundary>
        <ContentRefResolver contentRef={spec.entrypoint} />
      </AlertErrorBoundary>
    </Box>
  );
}

export default Dashboard;
