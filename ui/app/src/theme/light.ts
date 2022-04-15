import { getTheme } from './common';
import { EChartsWaldenTheme } from './echarts/theme-echarts-walden';

/**
 * Need to reinstantiate the theme everytime to support switching between light and dark themes
 * https://github.com/mui-org/material-ui/issues/18831
 */
export const getLightTheme = () => {
  return getTheme({
    components: {
      MuiCssBaseline: {
        styleOverrides: {},
      },
      MuiButton: {},
      MuiLink: {},
    },
    chart: EChartsWaldenTheme,
  });
};
