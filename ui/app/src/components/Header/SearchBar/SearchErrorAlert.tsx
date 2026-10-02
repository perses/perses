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

import { Alert, Box } from '@mui/material';
import type { StatusError } from '@perses-dev/client';
import type { ReactElement } from 'react';

const searchErrorAlertBoxSx = { margin: 1 };
const searchErrorAlertSx = {
  alignItems: 'center',
  '& .MuiAlert-message': {
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
};

function isForbiddenError(error: StatusError | null | undefined): boolean {
  return error?.status === 403;
}

export interface SearchErrorAlertProps {
  title: string;
  error: StatusError;
}

export function SearchErrorAlert({ title, error }: SearchErrorAlertProps): ReactElement {
  // Permission failures are handled by skipping unauthorized searches. If a 403 still
  // reaches the UI, keep the copy generic so RBAC scope/kind names are not exposed.
  const detail = isForbiddenError(error)
    ? 'you do not have permission to view this'
    : error.message?.trim() || 'Unknown error';

  return (
    <Box sx={searchErrorAlertBoxSx}>
      <Alert severity="error" sx={searchErrorAlertSx}>
        {title}: {detail}
      </Alert>
    </Box>
  );
}
