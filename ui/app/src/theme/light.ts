import { getTheme } from './common';

export const getLightTheme = () => {
  return getTheme({
    components: {
      MuiCssBaseline: {
        styleOverrides: {},
      },
      MuiButton: {},
    },
  });
};
