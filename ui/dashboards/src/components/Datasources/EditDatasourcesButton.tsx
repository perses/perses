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

import { useState } from 'react';
import { Button } from '@mui/material';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import { Drawer, InfoTooltip } from '@perses-dev/components';
import { DatasourceSpec } from '@perses-dev/core';
import { useDatasourceStore } from '@perses-dev/plugin-system';
import { TOOLTIP_TEXT } from '../../constants';
import { useDatasourceActions } from '../../context';
import { DatasourceEditor } from './DatasourceEditor';

export function EditDatasourcesButton() {
  const [isDatasourceEditorOpen, setIsDatasourceEditorOpen] = useState(false);
  const { getLocalDatasources } = useDatasourceStore();
  const localDatasources: Record<string, DatasourceSpec> = getLocalDatasources();
  const { setDatasources } = useDatasourceActions();

  const openDatasourceEditor = () => {
    setIsDatasourceEditorOpen(true);
  };

  const closeDatasourceEditor = () => {
    setIsDatasourceEditorOpen(false);
  };

  return (
    <>
      <InfoTooltip description={TOOLTIP_TEXT.editDatasources}>
        <Button
          startIcon={<PencilIcon />}
          onClick={openDatasourceEditor}
          aria-label={TOOLTIP_TEXT.editDatasources}
          variant="text"
          color="primary"
          sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
        >
          Datasources
        </Button>
      </InfoTooltip>
      <Drawer
        isOpen={isDatasourceEditorOpen}
        onClose={closeDatasourceEditor}
        PaperProps={{ sx: { width: '50%' } }}
        data-testid="datasource-editor"
      >
        <DatasourceEditor
          localDatasources={localDatasources}
          onCancel={closeDatasourceEditor}
          onChange={(datasources: Record<string, DatasourceSpec>) => {
            setDatasources(datasources);
            setIsDatasourceEditorOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
