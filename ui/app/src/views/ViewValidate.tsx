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

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AutoFix from 'mdi-material-ui/AutoFix';
import Upload from 'mdi-material-ui/Upload';
import { ChangeEvent, useState } from 'react';
import { useValidateDashboard } from '../model/validate';

function ViewValidate() {
  const [persesDashboard, setPersesDashboard] = useState<string>('');
  const isLaptopSize = useMediaQuery(useTheme().breakpoints.up('sm'));
  const validateMutation = useValidateDashboard();
  console.log(validateMutation);

  const fileUploadOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files === null) {
      return;
    }
    const value = await files[0]?.text();
    if (value !== undefined) {
      completePersesDashboard(value);
    }
  };
  const completePersesDashboard = (dashboard: string) => {
    setPersesDashboard(dashboard);
  };
  return (
    <Container maxWidth="md">
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <Typography variant="h1">Validate</Typography>
      </Stack>
      <Stack direction={'column'} spacing={1} mt={2}>
        <Button
          startIcon={<Upload />}
          variant="contained"
          component="label"
          sx={{ width: isLaptopSize ? '25%' : '50%' }}
        >
          Upload JSON file
          <input type="file" onChange={fileUploadOnChange} hidden />
        </Button>
        <TextField
          value={persesDashboard}
          onChange={(e) => completePersesDashboard(e.target.value)}
          multiline
          fullWidth
          minRows={10}
          maxRows={20}
          label="Perses dashboard"
          placeholder="Paste your Perses dashboard"
        />
        <Button
          disabled={validateMutation.isLoading || persesDashboard.length == 0}
          startIcon={<AutoFix />}
          onClick={() => {
            validateMutation.mutate({ dashboard: persesDashboard });
          }}
        >
          Validate
        </Button>
        {validateMutation.isLoading && <CircularProgress sx={{ alignSelf: 'center' }} />}
        {validateMutation.isError && (
          <Alert variant={'outlined'} severity={'error'}>
            {validateMutation.error.message}
            {validateMutation.error.stack}
          </Alert>
        )}
        {validateMutation.isSuccess && (
          <Box>
            <Typography>Dashboard is valid.</Typography>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

export default ViewValidate;
