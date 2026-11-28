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

import { Button, Stack, Typography } from '@mui/material';
import type { FolderResource, StatusError } from '@perses-dev/client';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

export type FolderViewExceptionProps = Pick<
  UseQueryResult<FolderResource, StatusError>,
  'error' | 'isFetching' | 'refetch'
> & {
  projectName: string;
  rootFolder: string;
};

export const HTTP_STATUS = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
} as const;

export const FolderViewException = (props: FolderViewExceptionProps): ReactElement => {
  const { error, isFetching, projectName, rootFolder, refetch } = props;

  const status = error?.status;
  const isNotfound = status === HTTP_STATUS.NOT_FOUND;
  const isForbidden = status === HTTP_STATUS.FORBIDDEN;

  let title = '';
  let description = '';

  if (isNotfound) {
    title = 'Folder not found!';
    description = `The folder "${rootFolder}" could not be found.`;
  } else if (isForbidden) {
    title = 'Access denied';
    description = 'You do not have permission to access this folder.';
  } else {
    title = 'Unable to load folder!';
    description = `Failed to load folder ${status ? `(HTTP) ${status}` : ''}. Please try again.`;
  }

  return (
    <Stack width="100%" minHeight="60vh" alignItems="center" justifyContent="center" spacing={2}>
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
      <Stack direction="row" spacing={2}>
        {!isNotfound && !isForbidden && (
          <Button
            variant="contained"
            disabled={isFetching}
            onClick={() => {
              refetch();
            }}
          >
            {isFetching ? 'Retrying...' : 'Retry'}
          </Button>
        )}
        <Button component={Link} to={`/projects/${encodeURIComponent(projectName ?? '')}`}>
          Back to project
        </Button>
      </Stack>
    </Stack>
  );
};
