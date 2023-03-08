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

import { Button, ButtonProps } from '@mui/material';
import AddPanelIcon from 'mdi-material-ui/ChartBoxPlusOutline';
import { InfoTooltip } from '@perses-dev/components';
import { TOOLTIP_TEXT } from '../../constants';
import { useDashboardActions } from '../../context';

export interface AddPanelButtonProps extends Pick<ButtonProps, 'fullWidth'> {
  /**
   * The variant to use to display the button. The `primary` variant is used
   * in toolbars. The `secondary` variant is used in the empty state messaging.
   */
  variant?: 'primary' | 'secondary';

  /**
   * The type of text used to communicate the purpose of the button. The `short`
   * label is brief and takes up less space. The `long` label is more detailed,
   * but takes up more space.
   */
  labelType?: 'short' | 'long';
}

export const AddPanelButton = ({ variant = 'primary', labelType = 'short', fullWidth }: AddPanelButtonProps) => {
  const { openAddPanel } = useDashboardActions();

  return (
    <InfoTooltip description={TOOLTIP_TEXT.addPanel}>
      <Button
        startIcon={<AddPanelIcon />}
        onClick={openAddPanel}
        aria-label={TOOLTIP_TEXT.addPanel}
        variant={variant === 'primary' ? 'text' : 'outlined'}
        color={variant === 'primary' ? 'primary' : 'secondary'}
        fullWidth={fullWidth}
        sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
      >
        {labelType === 'long' && 'Add'} Panel
      </Button>
    </InfoTooltip>
  );
};
