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

import React, { useEffect, useRef, useState } from 'react';
import { produce } from 'immer';
import { IconButton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import PlusIcon from 'mdi-material-ui/Plus';
import { Stack } from '@mui/system';
import { ThresholdOptions } from '@perses-dev/core';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { OptionsEditorControl, OptionsEditorGroup } from '../OptionsEditorLayout';
import { InfoTooltip } from '../InfoTooltip';
import { ThresholdColorPicker } from './ThresholdColorPicker';
import { ThresholdInput } from './ThresholdInput';

export interface ThresholdsEditorProps {
  onChange: (thresholds: ThresholdOptions) => void;
  thresholds?: ThresholdOptions;
  hideDefault?: boolean;
  disablePercentMode?: boolean;
}

const DEFAULT_STEP = 10;

export function ThresholdsEditor({ thresholds, onChange, hideDefault, disablePercentMode }: ThresholdsEditorProps) {
  const {
    thresholds: { defaultColor, palette },
  } = useChartsTheme();
  const defaultThresholdColor = thresholds?.default_color ?? defaultColor;

  const [steps, setSteps] = useState(thresholds?.steps);
  useEffect(() => {
    setSteps(thresholds?.steps);
  }, [thresholds?.steps]);

  // every time a new threshold is added, we want to focus the recently added input
  const recentlyAddedInputRef = useRef<HTMLInputElement | null>(null);
  const focusRef = useRef(false);
  useEffect(() => {
    if (!recentlyAddedInputRef.current || !focusRef.current) return;
    recentlyAddedInputRef.current?.focus();
    focusRef.current = false;
  }, [steps?.length]);

  const handleThresholdValueChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    setSteps(
      produce(steps, (draft) => {
        const step = draft?.[i];
        if (step) {
          step.value = Number(e.target.value);
        }
      })
    );
  };

  const handleThresholdColorChange = (color: string, i: number) => {
    if (thresholds !== undefined) {
      onChange(
        produce(thresholds, (draft) => {
          if (draft.steps !== undefined) {
            const step = draft.steps[i];
            if (step) {
              step.color = color;
            }
          }
        })
      );
    }
  };

  const handleDefaultColorChange = (color: string) => {
    if (thresholds !== undefined) {
      onChange(
        produce(thresholds, (draft) => {
          draft.default_color = color;
        })
      );
    } else {
      onChange({
        default_color: color,
      });
    }
  };

  // sort thresholds in ascending order every time an input blurs
  const handleThresholdBlur = () => {
    if (steps !== undefined) {
      const sortedSteps = [...steps];
      sortedSteps.sort((a, b) => a.value - b.value);
      if (thresholds !== undefined) {
        onChange(
          produce(thresholds, (draft) => {
            draft.steps = sortedSteps;
          })
        );
      }
    }
  };

  const deleteThreshold = (i: number): void => {
    if (thresholds !== undefined) {
      const updatedThresholds = produce(thresholds, (draft) => {
        if (draft.steps) {
          draft.steps.splice(i, 1);
        }
      });
      onChange(updatedThresholds);
    }
  };

  const addThresholdInput = (): void => {
    focusRef.current = true;
    if (thresholds === undefined) {
      onChange({
        steps: [{ value: DEFAULT_STEP }],
      });
    } else if (thresholds && thresholds.steps === undefined) {
      onChange(
        produce(thresholds, (draft) => {
          draft.steps = [{ value: DEFAULT_STEP }];
        })
      );
    } else {
      onChange(
        produce(thresholds, (draft) => {
          const steps = draft.steps;
          if (steps?.length) {
            const lastStep = steps[steps.length - 1];
            const color = palette[steps.length] ?? getRandomColor(); // we will assign color from the palette first, then generate random color
            steps.push({ color, value: (lastStep?.value ?? 0) + DEFAULT_STEP }); // set new threshold value to last step value + 10
          } else if (steps) {
            steps.push({ value: DEFAULT_STEP });
          }
        })
      );
    }
  };

  const handleModeChange = (event: React.MouseEvent, value: string): void => {
    const mode = value === 'Percent' ? 'Percent' : undefined;
    if (thresholds !== undefined) {
      onChange(
        produce(thresholds, (draft) => {
          draft.mode = mode;
        })
      );
    } else {
      onChange({ mode });
    }
  };

  return (
    <OptionsEditorGroup
      title="Thresholds"
      icon={
        <InfoTooltip description={'Add threshold'}>
          <IconButton size="small" aria-label="add threshold" onClick={addThresholdInput}>
            <PlusIcon />
          </IconButton>
        </InfoTooltip>
      }
    >
      <OptionsEditorControl
        label="Mode"
        description="Percentage means thresholds relative to min & max"
        control={
          <ToggleButtonGroup
            exclusive
            disabled={disablePercentMode}
            value={thresholds?.mode ?? 'Absolute'}
            onChange={handleModeChange}
            sx={{ height: '36px', marginLeft: 'auto' }}
          >
            <ToggleButton aria-label="absolute" value="Absolute" sx={{ fontWeight: 500 }}>
              Absolute
            </ToggleButton>
            <ToggleButton aria-label="percent" value="Percent" sx={{ fontWeight: 500 }}>
              Percent
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />
      {steps &&
        steps
          .map((step, i) => (
            <ThresholdInput
              inputRef={i === steps.length - 1 ? recentlyAddedInputRef : undefined}
              key={i}
              label={`T${i + 1}`}
              color={step.color ?? palette[i] ?? defaultThresholdColor}
              value={step.value}
              mode={thresholds?.mode}
              onColorChange={(color) => handleThresholdColorChange(color, i)}
              onChange={(e) => {
                handleThresholdValueChange(e, i);
              }}
              onDelete={() => {
                deleteThreshold(i);
              }}
              onBlur={handleThresholdBlur}
            />
          ))
          .reverse()}
      {!hideDefault && (
        <Stack flex={1} direction="row" alignItems="center" spacing={1}>
          <ThresholdColorPicker
            label="default"
            color={defaultThresholdColor}
            onColorChange={handleDefaultColorChange}
          />
          <Typography>Default</Typography>
        </Stack>
      )}
    </OptionsEditorGroup>
  );
}

// https://www.paulirish.com/2009/random-hex-color-code-snippets/
const getRandomColor = () => {
  return (
    '#' +
    Math.floor(Math.random() * 16777216)
      .toString(16)
      .padStart(6, '0')
  );
};
