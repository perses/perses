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

import type { SelectChangeEvent } from '@mui/material';
import {
  Alert,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { DatasourceSelector } from '@perses-dev/spec';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import type { LabelClient, LabelRequestParams } from './label-client';
import { useLabelValues } from './label-client';
import type { LabelFilter, LabelOperator } from './log-selector';
import { getValueOperator, isLabelOperator, LABEL_OPERATORS } from './log-selector';

const MAX_DISPLAYED_VALUES = 200;
const MONOSPACE_SX = { fontFamily: 'monospace', wordBreak: 'break-all' } as const;
const LABEL_BUTTON_SX = { px: 0.5 };
const VALUES_LIST_SX = { pl: 3 };
const VALUE_BUTTON_SX = { px: 0.5, py: 0, borderRadius: 1, minWidth: 0 };
const LOADING_SX = { m: 1 };
const MORE_VALUES_SX = { px: 0.5 };
const LABEL_TEXT_PROPS = { primary: { sx: MONOSPACE_SX } };
const SELECTED_LABEL_TEXT_PROPS = { primary: { sx: { ...MONOSPACE_SX, color: 'primary.main', fontWeight: 600 } } };
const VALUE_TEXT_PROPS = { primary: { variant: 'body2', sx: { wordBreak: 'break-all' } } } as const;
const SELECTED_VALUE_TEXT_PROPS = {
  primary: { variant: 'body2', sx: { wordBreak: 'break-all', fontWeight: 600 } },
} as const;
// Compact operator select, sized to the label value text next to it.
const OPERATOR_SELECT_SX = {
  flexShrink: 0,
  width: 46,
  height: 24,
  fontFamily: 'monospace',
  typography: 'body2',
  '& .MuiSelect-select': { py: 0, pl: 0.75, pr: '18px !important' },
  '& .MuiSelect-icon': { right: 0, fontSize: '1.1rem' },
};

export interface LabelItemProps {
  label: string;
  client: LabelClient;
  params: LabelRequestParams;
  datasource: DatasourceSelector;
  /** Filters of the query. Only the filters of this label are used. */
  filters: LabelFilter[];
  expanded: boolean;
  onExpandedChange: (label: string | undefined) => void;
  onToggleValue: (label: string, value: string, operator: LabelOperator) => void;
  onOperatorChange: (label: string, value: string, operator: LabelOperator) => void;
}

/** A label of the label explorer, which lists its values with an operator each once expanded. */
export function LabelItem(props: LabelItemProps): ReactElement {
  const { label, client, params, datasource, filters, expanded, onExpandedChange, onToggleValue, onOperatorChange } =
    props;
  // Operators picked for values that are not selected yet.
  const [pendingOperators, setPendingOperators] = useState<Record<string, LabelOperator>>({});
  const selectedCount = filters.reduce(
    (count, filter) => (filter.label === label ? count + filter.values.length : count),
    0,
  );
  const { data: values, isLoading, error } = useLabelValues(datasource, client, params, label, expanded);

  const handleExpandedChange = useCallback(
    () => onExpandedChange(expanded ? undefined : label),
    [expanded, label, onExpandedChange],
  );
  const handlePendingOperatorChange = useCallback(
    (value: string, operator: LabelOperator) => setPendingOperators((current) => ({ ...current, [value]: operator })),
    [],
  );

  return (
    <>
      <ListItemButton onClick={handleExpandedChange} sx={LABEL_BUTTON_SX} aria-expanded={expanded}>
        {expanded ? <ChevronDown fontSize="small" /> : <ChevronRight fontSize="small" />}
        <ListItemText primary={label} slotProps={selectedCount > 0 ? SELECTED_LABEL_TEXT_PROPS : LABEL_TEXT_PROPS} />
        {selectedCount > 0 && (
          <Typography variant="caption" color="primary">
            ({selectedCount})
          </Typography>
        )}
      </ListItemButton>
      {expanded && (
        <List dense disablePadding sx={VALUES_LIST_SX} aria-label={`Values of ${label}`}>
          {isLoading && <CircularProgress size={16} sx={LOADING_SX} />}
          {error && <Alert severity="error">{error.message}</Alert>}
          {values?.slice(0, MAX_DISPLAYED_VALUES).map((value) => {
            const selectedOperator = getValueOperator(filters, label, value);
            return (
              <LabelValueRow
                key={value}
                label={label}
                value={value}
                operator={selectedOperator ?? pendingOperators[value] ?? '='}
                selected={selectedOperator !== undefined}
                onToggleValue={onToggleValue}
                onOperatorChange={onOperatorChange}
                onPendingOperatorChange={handlePendingOperatorChange}
              />
            );
          })}
          {values && values.length > MAX_DISPLAYED_VALUES && (
            <Typography variant="caption" color="text.secondary" sx={MORE_VALUES_SX}>
              Showing the first {MAX_DISPLAYED_VALUES} of {values.length} values.
            </Typography>
          )}
        </List>
      )}
    </>
  );
}

interface LabelValueRowProps {
  label: string;
  value: string;
  operator: LabelOperator;
  selected: boolean;
  onToggleValue: (label: string, value: string, operator: LabelOperator) => void;
  onOperatorChange: (label: string, value: string, operator: LabelOperator) => void;
  onPendingOperatorChange: (value: string, operator: LabelOperator) => void;
}

function LabelValueRow(props: LabelValueRowProps): ReactElement {
  const { label, value, operator, selected, onToggleValue, onOperatorChange, onPendingOperatorChange } = props;

  const handleOperatorChange = useCallback(
    (event: SelectChangeEvent) => {
      const next = event.target.value;
      if (!isLabelOperator(next)) return;
      onPendingOperatorChange(value, next);
      if (selected) onOperatorChange(label, value, next);
    },
    [label, value, selected, onOperatorChange, onPendingOperatorChange],
  );
  const handleToggle = useCallback(
    () => onToggleValue(label, value, operator),
    [label, value, operator, onToggleValue],
  );
  const selectInputProps = useMemo(() => ({ 'aria-label': `Operator for ${label} ${value}` }), [label, value]);

  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Select
        size="small"
        value={operator}
        onChange={handleOperatorChange}
        inputProps={selectInputProps}
        sx={OPERATOR_SELECT_SX}
      >
        {LABEL_OPERATORS.map((op) => (
          <MenuItem key={op} value={op} dense sx={MONOSPACE_SX}>
            {op}
          </MenuItem>
        ))}
      </Select>
      <ListItemButton
        selected={selected}
        aria-pressed={selected}
        title={selected ? 'Remove this filter' : `Filter ${label}${operator}"${value}"`}
        onClick={handleToggle}
        sx={VALUE_BUTTON_SX}
      >
        <ListItemText
          primary={value === '' ? '(empty)' : value}
          slotProps={selected ? SELECTED_VALUE_TEXT_PROPS : VALUE_TEXT_PROPS}
        />
      </ListItemButton>
    </Stack>
  );
}
