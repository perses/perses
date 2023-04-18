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

import { Card, CardContent, CircularProgress, Stack } from '@mui/material';
import InformationIcon from 'mdi-material-ui/Information';
import { useInformation } from '../../model/config-client';

/*
 * Information section is displayed if there is information provided by the config
 */
export function InformationSection() {
  const { data, isLoading } = useInformation();

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (data) {
    return (
      <>
        <Stack direction="row" alignItems="center" gap={1}>
          <InformationIcon />
          <h2>Information</h2>
        </Stack>
        <Card>
          <CardContent dangerouslySetInnerHTML={{ __html: data }}></CardContent>
        </Card>
      </>
    );
  }

  return <></>;
}
