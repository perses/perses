import { Components, Theme, alertClasses, linkClasses } from '@mui/material';

export const MuiAlert: Components<Theme>['MuiAlert'] = {
  defaultProps: {
    variant: 'standard',
    severity: 'success',
  },
  styleOverrides: {
    standardError: ({ theme }) => {
      return theme.palette.mode === 'dark'
        ? {
            ...theme.typography.body1,
            backgroundColor: theme.palette.error.dark,
            color: theme.palette.error.light,
            [`&	.${alertClasses.icon}`]: {
              color: theme.palette.error.main,
            },
          }
        : {
            ...theme.typography.body1,
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.dark,
            [`&	.${alertClasses.icon}`]: {
              color: theme.palette.error.main,
            },
          };
    },
    standardInfo: ({ theme }) => {
      return theme.palette.mode === 'dark'
        ? {
            ...theme.typography.body1,
            backgroundColor: theme.palette.info.dark,
            color: theme.palette.info.light,
            [`&	.${alertClasses.icon}`]: {
              color: theme.palette.info.main,
            },
          }
        : {
            ...theme.typography.body1,
            backgroundColor: theme.palette.info.light,
            color: theme.palette.info.dark,
            [`&	.${alertClasses.icon}`]: {
              color: theme.palette.info.main,
            },
          };
    },
    standardSuccess: ({ theme }) => {
      return theme.palette.mode === 'dark'
        ? {
            ...theme.typography.body1,
            backgroundColor: theme.palette.success.dark,
            color: theme.palette.success.light,
            [`&	.${alertClasses.icon}`]: {
              color: theme.palette.success.main,
            },
          }
        : {
            ...theme.typography.body1,
            backgroundColor: theme.palette.success.light,
            color: theme.palette.success.dark,
            [`&	.${alertClasses.icon}`]: {
              color: theme.palette.success.main,
            },
          };
    },
    standardWarning: ({ theme }) => {
      return theme.palette.mode === 'dark'
        ? {
            ...theme.typography.body1,
            backgroundColor: theme.palette.warning.dark,
            color: theme.palette.warning.light,
            [`&	.${alertClasses.icon}`]: {
              color: theme.palette.warning.main,
            },
          }
        : {
            ...theme.typography.body1,
            backgroundColor: theme.palette.warning.light,
            color: theme.palette.warning.dark,
            [`&	.${alertClasses.icon}`]: {
              color: theme.palette.warning.main,
            },
          };
    },
    root: {
      ['& .' + linkClasses.root]: {
        textDecoration: 'underline',
      },
    },
  },
};
