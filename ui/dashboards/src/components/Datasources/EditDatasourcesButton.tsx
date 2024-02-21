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
import { TOOLTIP_TEXT, editButtonStyle } from '../../constants';
import { useDashboard } from '../../context';
import { DatasourceEditor } from './DatasourceEditor';

export function EditDatasourcesButton() {
  const [isDatasourceEditorOpen, setIsDatasourceEditorOpen] = useState(false);
  const { getLocalDatasources, setLocalDatasources, getSavedDatasources, setSavedDatasources } = useDatasourceStore();
  const localDatasources: Record<string, DatasourceSpec> = getLocalDatasources();
  const savedDatasources: Record<string, DatasourceSpec> = getSavedDatasources();
  const { dashboard, setDashboard } = useDashboard();

  const openDatasourceEditor = () => {
    setIsDatasourceEditorOpen(true);
  };

  const closeDatasourceEditor = () => {
    setIsDatasourceEditorOpen(false);
  };

  const handleChangeDatasources = (datasources: Record<string, DatasourceSpec>) => {
    // Calculates the new list of datasources that are allowed to be used.
    const newSavedDatasources: Record<string, DatasourceSpec> = Object.keys(datasources)
      .filter((key) => {
        // Datasources are allowed to be used if a) they are direct, or b) they are proxied, and their
        // proxy is the same as what we have saved.
        const isDirect = 'directUrl' in (datasources[key]?.plugin?.spec ?? {});
        const isSavedProxy =
          !isDirect &&
          !('directUrl' in (savedDatasources[key]?.plugin?.spec ?? {})) &&
          datasources[key]?.plugin?.spec?.proxy === savedDatasources[key]?.plugin?.spec?.proxy;

        return isDirect || isSavedProxy;
      })
      .reduce(
        (obj, key) => {
          obj[key] = datasources[key] as DatasourceSpec;

          return obj;
        },
        {} as Record<string, DatasourceSpec>
      );

    setDashboard({
      ...dashboard,
      spec: {
        ...dashboard.spec,
        datasources: datasources,
      },
    });
    setSavedDatasources(newSavedDatasources);
    setLocalDatasources(datasources);
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
          sx={editButtonStyle}
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
          datasources={localDatasources}
          onCancel={closeDatasourceEditor}
          onChange={handleChangeDatasources}
        />
      </Drawer>
    </>
  );
}
