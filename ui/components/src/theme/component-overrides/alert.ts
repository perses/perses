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
