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

import React, { useState } from 'react';
import { Alert, Box, Card, Chip, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import { InfoTooltip } from '@perses-dev/components';
import Refresh from 'mdi-material-ui/Refresh';
import Clipboard from 'mdi-material-ui/ClipboardOutline';
import { ListVariableDefinition } from '@perses-dev/core';
import { TOOLTIP_TEXT } from '../../../constants';
import { useListVariablePluginValues } from '../variable-model';
import { useSnackbar } from '../../../context';

const DEFAULT_MAX_PREVIEW_VALUES = 50;

interface VariablePreviewProps {
  values?: string[];
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string;
}

export function VariablePreview(props: VariablePreviewProps) {
  const { values, onRefresh, isLoading, error } = props;
  const [maxValues, setMaxValues] = useState<number | undefined>(DEFAULT_MAX_PREVIEW_VALUES);
  const { infoSnackbar } = useSnackbar();
  const showAll = () => {
    setMaxValues(undefined);
  };
  let notShown = 0;

  if (values && values?.length > 0 && maxValues) {
    notShown = values.length - maxValues;
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Typography variant="h4">Preview Values</Typography>
        {onRefresh && (
          <InfoTooltip description={TOOLTIP_TEXT.refreshVariableValues}>
            <IconButton onClick={onRefresh} size="small">
              <Refresh />
            </IconButton>
          </InfoTooltip>
        )}
        <InfoTooltip description={TOOLTIP_TEXT.copyVariableValues}>
          <IconButton
            onClick={async () => {
              if (values?.length) {
                await navigator.clipboard.writeText(values.map((value) => value).join(', '));
                infoSnackbar('Preview values copied to clipboard!');
              }
            }}
            size="small"
          >
            <Clipboard />
          </IconButton>
        </InfoTooltip>
      </Stack>
      <Card variant="outlined">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, m: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {values?.length === 0 && <Alert severity="info">No results</Alert>}
          {isLoading && (
            <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Stack>
          )}
          {values?.slice(0, maxValues).map((val) => (
            <Chip size="small" key={val} label={val} />
          ))}
          {notShown > 0 && <Chip onClick={showAll} variant="outlined" size="small" label={`+${notShown} more`} />}
        </Box>
      </Card>
    </Box>
  );
}

interface VariableListPreviewProps {
  definition: ListVariableDefinition;
  onRefresh: () => void;
}

export function VariableListPreview(props: VariableListPreviewProps) {
  const { definition, onRefresh } = props;
  const { data, isFetching, error } = useListVariablePluginValues(definition);
  const errorMessage = (error as Error)?.message;

  return (
    <VariablePreview
      values={data?.map((val) => val.value) || []}
      onRefresh={onRefresh}
      isLoading={isFetching}
      error={errorMessage}
    />
  );
}
