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
import { Button, ButtonProps } from '@mui/material';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import { Drawer, InfoTooltip } from '@perses-dev/components';
import { VariableDefinition } from '@perses-dev/core';

import { TOOLTIP_TEXT } from '../../constants';
import { useTemplateVariableDefinitions, useTemplateVariableActions } from '../../context';
import { VariableEditor } from './VariableEditor';

export interface EditVariablesButtonProps extends Pick<ButtonProps, 'fullWidth'> {
  /**
   * The variant to use to display the button.
   */
  variant?: 'text' | 'outlined';

  /**
   * The color to use to display the button.
   */
  color?: 'primary' | 'secondary';

  /**
   * The label used inside the button.
   */
  label?: string;
}

export function EditVariablesButton({
  variant = 'text',
  label = 'Variables',
  color = 'primary',
  fullWidth,
}: EditVariablesButtonProps) {
  const [isVariableEditorOpen, setIsVariableEditorOpen] = useState(false);
  const variableDefinitions: VariableDefinition[] = useTemplateVariableDefinitions();
  const { setVariableDefinitions } = useTemplateVariableActions();

  const openVariableEditor = () => {
    setIsVariableEditorOpen(true);
  };

  const closeVariableEditor = () => {
    setIsVariableEditorOpen(false);
  };

  return (
    <>
      <InfoTooltip description={TOOLTIP_TEXT.editVariables}>
        <Button
          startIcon={<PencilIcon />}
          onClick={openVariableEditor}
          aria-label={TOOLTIP_TEXT.editVariables}
          variant={variant}
          color={color}
          fullWidth={fullWidth}
          sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
        >
          {label}
        </Button>
      </InfoTooltip>
      <Drawer
        isOpen={isVariableEditorOpen}
        onClose={closeVariableEditor}
        PaperProps={{ sx: { width: '50%' } }}
        data-testid="variable-editor"
      >
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
