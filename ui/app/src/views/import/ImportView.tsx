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

import { Button, Container, Divider, Stack, Typography } from '@mui/material';
import { YAMLEditor } from '@perses-dev/components';
import AutoFix from 'mdi-material-ui/AutoFix';
import Upload from 'mdi-material-ui/Upload';
import type { ChangeEvent, ReactElement } from 'react';
import { useState } from 'react';
import { StringParam, useQueryParam } from 'use-query-params';

import { useIsMobileSize } from '../../utils/browser-size';
import GrafanaFlow from './GrafanaFlow';
import PersesFlow from './PersesFlow';
import { useParsedDashboard } from './use-parsed-dashboard';

function ImportView(): ReactElement {
  const [definition, setDefinition] = useState('');
  // Bumped on file upload to remount the editor, as it only uses its value as initial content.
  const [editorKey, setEditorKey] = useState(0);
  const dashboard = useParsedDashboard(definition);
  // Project selected by default in the import step, e.g. when the import is started from a project page.
  const [projectParam] = useQueryParam('project', StringParam);
  const defaultProject = projectParam ?? undefined;
  const isMobileSize = useIsMobileSize();

  const fileUploadOnChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (files === null) {
      return;
    }
    const value = await files[0]?.text();
    if (value !== undefined) {
      setDefinition(value);
      setEditorKey((key) => key + 1);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ padding: isMobileSize ? 1 : 2, overflowX: 'hidden' }}>
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <AutoFix fontSize="large" />
        <Typography variant="h1">Import</Typography>
      </Stack>
      <Stack direction="column" spacing={1}>
        <Typography variant="h2" sx={{ paddingTop: 2 }}>
          1. Provide a dashboard
        </Typography>
        <Button fullWidth startIcon={<Upload />} variant="outlined" component="label">
          Upload JSON or YAML file
          <input type="file" accept=".json,.yaml,.yml" onChange={fileUploadOnChange} hidden style={{ width: '100%' }} />
        </Button>
        <Divider>OR</Divider>
        <YAMLEditor
          key={editorKey}
          value={definition}
          onChange={setDefinition}
          minHeight="10rem"
          maxHeight="30rem"
          width="100%"
          placeholder="Paste your Dashboard JSON or YAML here..."
        />
        {dashboard !== undefined && dashboard.kind === 'grafana' && (
          <GrafanaFlow dashboard={dashboard?.data} defaultProject={defaultProject} />
        )}
        {dashboard !== undefined && dashboard.kind === 'perses' && (
          <PersesFlow dashboard={dashboard?.data} defaultProject={defaultProject} />
        )}
      </Stack>
    </Container>
  );
}

export default ImportView;
