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

import type { Datasource, DatasourceDefinition } from '@perses-dev/client';
import { createTestDatasourceConnection } from '@perses-dev/client';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import type { FormEditorHandle } from '@perses-dev/components';
import { DatasourceEditorForm, PluginRegistry, ValidationProvider } from '@perses-dev/plugin-system';
import type { ReactElement } from 'react';
import { useMemo, useRef, useState } from 'react';

import { useRemotePluginLoader } from '../../model/remote-plugin-loader';
import { DeleteResourceDialog } from '../dialogs';
import type { DrawerProps } from '../form-drawers';

interface DatasourceDrawerProps<T extends Datasource> extends DrawerProps<T> {
  datasource: T;
}

export function DatasourceDrawer<T extends Datasource>({
  datasource,
  action,
  isOpen,
  isReadonly,
  onActionChange,
  onSave,
  onClose,
  onDelete,
}: DatasourceDrawerProps<T>): ReactElement {
  const [isDeleteDatasourceDialogStateOpened, setDeleteDatasourceDialogStateOpened] = useState<boolean>(false);

  // Let the form handle click out / Escape, so that it can ask for confirmation before discarding unsaved changes
  const formRef = useRef<FormEditorHandle>(null);
  const handleDrawerClose = (): void => {
    if (formRef.current) {
      formRef.current.requestClose();
    } else {
      onClose();
    }
  };
  const pluginLoader = useRemotePluginLoader();

  const project = datasource.kind === 'Datasource' ? datasource.metadata.project : undefined;
  const testConnection = useMemo(() => createTestDatasourceConnection({ project }), [project]);

  const handleSave = (def: DatasourceDefinition): void => {
    const updatedDatasource = structuredClone(datasource);
    updatedDatasource.spec = def.spec;
    updatedDatasource.metadata.name = def.name;
    if (onSave) {
      onSave(updatedDatasource);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleDrawerClose} data-testid="datasource-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <PluginRegistry pluginLoader={pluginLoader}>
          <ValidationProvider>
            {isOpen && (
              <DatasourceEditorForm
                ref={formRef}
                initialDatasourceDefinition={{ name: datasource.metadata.name, spec: datasource.spec }}
                action={action}
                isDraft={false}
                isReadonly={isReadonly}
                onActionChange={onActionChange}
                onSave={handleSave}
                onClose={onClose}
                onDelete={onDelete ? (): void => setDeleteDatasourceDialogStateOpened(true) : undefined}
                testConnection={testConnection}
              />
            )}
          </ValidationProvider>
        </PluginRegistry>
        {onDelete && (
          <DeleteResourceDialog
            open={isDeleteDatasourceDialogStateOpened}
            resource={datasource}
            onClose={() => setDeleteDatasourceDialogStateOpened(false)}
            onSubmit={(d) =>
              onDelete(d).then(() => {
                setDeleteDatasourceDialogStateOpened(false);
                onClose();
              })
            }
          />
        )}
      </ErrorBoundary>
    </Drawer>
  );
}
