import { Drawer, Typography } from '@material-ui/core';
import { useDashboardSpec } from '@perses-ui/core';
import AlertErrorFallback from '../../components/AlertErrorFallback';
import VariableAutocomplete from '../../components/VariableAutocomplete';
import { PluginBoundary } from '../../context/plugin-registry';

const DRAWER_WIDTH = 296;

/**
 * Dashboard options drawer that includes variable inputs.
 */
function OptionsDrawer() {
  const spec = useDashboardSpec();

  return (
    <Drawer
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          padding: (theme) => theme.spacing(1, 2),
        },
      }}
      variant="persistent"
      anchor="right"
      open={true}
    >
      <Typography component="h2" variant="h6">
        Variables
      </Typography>
      {Object.entries(spec.variables).map(([key, variableDef]) => {
        if (variableDef.display.hide === true) return null;

        return (
          <PluginBoundary
            key={key}
            loadingFallback="Loading..."
            ErrorFallbackComponent={AlertErrorFallback}
          >
            <VariableAutocomplete variableName={key} definition={variableDef} />
          </PluginBoundary>
        );
      })}
    </Drawer>
  );
}

export default OptionsDrawer;
