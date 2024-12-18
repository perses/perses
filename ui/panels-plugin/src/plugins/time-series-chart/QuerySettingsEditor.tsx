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

import { IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { InfoTooltip, OptionsEditorGroup, OptionsColorPicker } from '@perses-dev/components';
import { ReactElement, RefObject, useEffect, useMemo, useRef } from 'react';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PlusIcon from 'mdi-material-ui/Plus';
import produce from 'immer';
import { useQueryCountContext } from '@perses-dev/plugin-system';
import { QuerySettingsOptions } from './time-series-chart-model';

const DEFAULT_COLOR_MODE = 'fixed';
const DEFAULT_COLOR_VALUE = '#555';
const NO_INDEX_AVAILABLE = -1; // invalid array index value used to represent the fact that no query index is available

export interface QuerySettingsEditorProps {
  querySettingsList?: QuerySettingsOptions[];
  onChange: (querySettingsList: QuerySettingsOptions[]) => void;
}

export function QuerySettingsEditor({ querySettingsList, onChange }: QuerySettingsEditorProps): ReactElement {
  // Every time a new query settings input is added, we want to focus the recently added input
  const recentlyAddedInputRef = useRef<HTMLInputElement | null>(null);
  const focusRef = useRef(false);
  useEffect(() => {
    if (!recentlyAddedInputRef.current || !focusRef.current) return;
    recentlyAddedInputRef.current?.focus();
    focusRef.current = false;
  }, [querySettingsList?.length]);

  const handleQueryIndexChange = (e: React.ChangeEvent<HTMLInputElement>, i: number): void => {
    if (querySettingsList !== undefined) {
      onChange(
        produce(querySettingsList, (draft) => {
          const querySettings = draft?.[i];
          if (querySettings) {
            querySettings.queryIndex = parseInt(e.target.value);
          }
        })
      );
    }
  };

  const handleColorModeChange = (e: React.ChangeEvent<HTMLInputElement>, i: number): void => {
    if (querySettingsList !== undefined) {
      onChange(
        produce(querySettingsList, (draft) => {
          if (draft !== undefined) {
            const querySettings = draft[i];
            if (querySettings) {
              querySettings.colorMode = e.target.value as QuerySettingsOptions['colorMode'];
            }
          }
        })
      );
    }
  };

  const handleColorValueChange = (colorValue: string, i: number): void => {
    if (querySettingsList !== undefined) {
      onChange(
        produce(querySettingsList, (draft) => {
          if (draft !== undefined) {
            const querySettings = draft[i];
            if (querySettings) {
              querySettings.colorValue = colorValue;
            }
          }
        })
      );
    }
  };

  const deleteQuerySettingsInput = (i: number): void => {
    if (querySettingsList !== undefined) {
      const updatedQuerySettingsList = produce(querySettingsList, (draft) => {
        draft.splice(i, 1);
      });
      onChange(updatedQuerySettingsList);
    }
  };

  const queryCount = useQueryCountContext();

  // Compute the list of query indexes for which query settings are not already defined.
  // This is to avoid already-booked indexes to still be selectable in the dropdown(s)
  const availableQueryIndexes = useMemo(() => {
    const bookedQueryIndexes = querySettingsList?.map((querySettings) => querySettings.queryIndex) ?? [];
    const allQueryIndexes = Array.from({ length: queryCount }, (_, i) => i);
    return allQueryIndexes.filter((_, queryIndex) => !bookedQueryIndexes.includes(queryIndex));
  }, [querySettingsList, queryCount]);

  const firstAvailableQueryIndex = useMemo(() => {
    return availableQueryIndexes[0] ?? NO_INDEX_AVAILABLE;
  }, [availableQueryIndexes]);

  const defaultQuerySettings: QuerySettingsOptions = {
    queryIndex: firstAvailableQueryIndex,
    colorMode: DEFAULT_COLOR_MODE,
    colorValue: DEFAULT_COLOR_VALUE,
  };

  const addQuerySettingsInput = (): void => {
    focusRef.current = true;
    if (querySettingsList === undefined) {
      onChange([defaultQuerySettings]);
    } else {
      onChange(
        produce(querySettingsList, (draft) => {
          draft.push(defaultQuerySettings);
        })
      );
    }
  };

  return (
    <OptionsEditorGroup
      title="Query settings"
      icon={
        firstAvailableQueryIndex !== NO_INDEX_AVAILABLE ? (
          <InfoTooltip description="Add query settings">
            <IconButton size="small" aria-label="add query settings" onClick={addQuerySettingsInput}>
              <PlusIcon />
            </IconButton>
          </InfoTooltip>
        ) : null
      }
    >
      {querySettingsList && querySettingsList.length > 0 ? (
        querySettingsList.map((querySettings, i) => (
          <QuerySettingsInput
            inputRef={i === querySettingsList.length - 1 ? recentlyAddedInputRef : undefined}
            key={i}
            querySettings={querySettings}
            availableQueryIndexes={availableQueryIndexes}
            onQueryIndexChange={(e) => {
              handleQueryIndexChange(e, i);
            }}
            onColorModeChange={(e) => handleColorModeChange(e, i)}
            onColorValueChange={(color) => handleColorValueChange(color, i)}
            onDelete={() => {
              deleteQuerySettingsInput(i);
            }}
          />
        ))
      ) : (
        <Typography mb={2} fontStyle="italic">
          No query settings defined
        </Typography>
      )}
    </OptionsEditorGroup>
  );
}

export interface QuerySettingsInputProps {
  querySettings: QuerySettingsOptions;
  availableQueryIndexes: number[];
  onQueryIndexChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorModeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorValueChange: (colorValue: string) => void;
  onDelete: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function QuerySettingsInput({
  querySettings: { queryIndex, colorMode, colorValue },
  availableQueryIndexes,
  onQueryIndexChange,
  onColorModeChange,
  onColorValueChange,
  onDelete,
  inputRef,
}: QuerySettingsInputProps): ReactElement {
  // current query index should also be selectable
  const selectableQueryIndexes = availableQueryIndexes.concat(queryIndex).sort((a, b) => a - b);

  return (
    <Stack flex={1} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <TextField
        select
        inputRef={inputRef}
        value={queryIndex}
        label="Query"
        onChange={onQueryIndexChange}
        sx={{ minWidth: '75px' }} // instead of `fullWidth` otherwise it's taking too much space
      >
        {selectableQueryIndexes.map((queryIndex) => (
          <MenuItem key={`query-${queryIndex}`} value={queryIndex}>
            #{queryIndex + 1}
          </MenuItem>
        ))}
      </TextField>
      <TextField select value={colorMode} fullWidth label="Color mode" onChange={onColorModeChange}>
        <MenuItem value="fixed-single">Fixed (single)</MenuItem>
        <MenuItem value="fixed">Fixed</MenuItem>
      </TextField>
      <OptionsColorPicker label={'Query n°' + queryIndex} color={colorValue} onColorChange={onColorValueChange} />
      <IconButton aria-label={`delete settings for query n°${queryIndex + 1}`} size="small" onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
}
