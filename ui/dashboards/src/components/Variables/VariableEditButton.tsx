// Copyright 2022 The Perses Authors
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
import { Drawer, InfoTooltip, TooltipPlacement } from '@perses-dev/components';
import { VariableDefinition } from '@perses-dev/core';

import { useTemplateVariableDefinitions, useTemplateVariableActions } from '../../context';
import { VariableEditor } from './VariableEditor';

const EDIT_VARIABLES_BUTTON_DESCRIPTION = 'Edit variables';

export function VariableEditButton() {
  const [isVariableEditorOpen, setIsVariableEditorOpen] = useState(false);
  const variableDefinitions = useTemplateVariableDefinitions();
  const { setVariableDefinitions } = useTemplateVariableActions();

  const openVariableEditor = () => {
    setIsVariableEditorOpen(true);
  };

  const closeVariableEditor = () => {
    setIsVariableEditorOpen(false);
  };

  return (
    <>
      <InfoTooltip description={EDIT_VARIABLES_BUTTON_DESCRIPTION} placement={TooltipPlacement.Bottom}>
        <Button startIcon={<PencilIcon />} onClick={openVariableEditor} aria-label={EDIT_VARIABLES_BUTTON_DESCRIPTION}>
          Variables
        </Button>
      </InfoTooltip>
      <Drawer isOpen={isVariableEditorOpen} onClose={closeVariableEditor} PaperProps={{ sx: { width: '50%' } }}>
        <VariableEditor
          variableDefinitions={variableDefinitions}
          onCancel={closeVariableEditor}
          onChange={(variables: VariableDefinition[]) => {
            setVariableDefinitions(variables);
            setIsVariableEditorOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
