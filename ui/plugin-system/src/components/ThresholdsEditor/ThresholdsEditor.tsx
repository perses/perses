import React, { RefObject, useEffect, useRef, useState } from 'react';
import produce from 'immer';
import { IconButton, TextField, Typography } from '@mui/material';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PlusIcon from 'mdi-material-ui/Plus';
import CircleIcon from 'mdi-material-ui/Circle';
import { Stack } from '@mui/system';
import { OptionsEditorGroup, useChartsTheme } from '@perses-dev/components';
import { ThresholdOptions } from '../../model/thresholds';

interface ThresholdsEditorProps {
  thresholds?: ThresholdOptions;
  onChange: (thresholds: ThresholdOptions) => void;
}

export function ThresholdsEditor({ thresholds, onChange }: ThresholdsEditorProps) {
  const {
    thresholds: { defaultColor, palette },
  } = useChartsTheme();

  const [steps, setSteps] = useState(thresholds?.steps);
  useEffect(() => {
    setSteps(thresholds?.steps);
  }, [thresholds?.steps]);

  const recentlyAddedInputRef = useRef<HTMLInputElement | null>(null);
  const focusRef = useRef(false);
  useEffect(() => {
    if (!recentlyAddedInputRef.current || !focusRef.current) return;
    recentlyAddedInputRef.current?.focus();
    focusRef.current = false;
  }, [steps?.length]);

  const handleThresholdChange: (e: React.ChangeEvent<HTMLInputElement>, i: number) => void = (e, i) => {
    setSteps(
      produce(steps, (draft) => {
        const step = draft?.[i];
        if (step?.value !== undefined) {
          step.value = Number(e.target.value) ?? '';
        }
      })
    );
  };

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
    if (steps !== undefined && thresholds !== undefined) {
      const updatedThresholds = produce(thresholds, (draft) => {
        const steps = draft.steps;
        if (steps !== undefined) {
          steps.splice(i, 1);
        }
      });
      onChange(updatedThresholds);
    }
  };

  const addThresholdInput = (): void => {
    focusRef.current = true;
    if (thresholds === undefined) {
      onChange({
        steps: [{ value: 10 }],
      });
    } else {
      onChange(
        produce(thresholds, (draft) => {
          const steps = draft.steps;
          if (steps !== undefined) {
            const lastStep = steps[steps.length - 1];
            const randomColorIndex = Math.floor(Math.random() * palette.length);
            const color = palette[randomColorIndex];
            steps.push({ color, value: (lastStep?.value ?? 0) + 10 });
          }
        })
      );
    }
  };

  return (
    <OptionsEditorGroup
      title="Thresholds"
      icon={
        <IconButton size="small" aria-label="add threshold" onClick={addThresholdInput}>
          <PlusIcon />
        </IconButton>
      }
    >
      {steps !== undefined &&
        steps
          ?.map((step, i) => (
            <ThresholdInput
              inputRef={i === steps.length - 1 ? recentlyAddedInputRef : undefined}
              key={i}
              index={i}
              color={step.color ?? palette[i] ?? defaultColor}
              value={step.value}
              onChange={(e) => {
                handleThresholdChange(e, i);
              }}
              onDelete={() => {
                deleteThreshold(i);
              }}
              onBlur={handleThresholdBlur}
            />
          ))
          .reverse()}
      <Stack flex={1} direction="row" alignItems="center" spacing={1}>
        <IconButton size="small" aria-label="change threshold color" sx={{ color: defaultColor }}>
          <CircleIcon />
        </IconButton>
        <Typography>Default</Typography>
      </Stack>
    </OptionsEditorGroup>
  );
}

interface ThresholdInputProps {
  inputRef?: RefObject<HTMLInputElement | null>;
  index: number;
  length?: number;
  space?: number;
  value: number;
  color?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onDelete?: () => void;
}

function ThresholdInput({ inputRef, index, color, value, onChange, onBlur, onDelete }: ThresholdInputProps) {
  return (
    <Stack flex={1} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <IconButton size="small" aria-label="change threshold color" sx={{ color }}>
        <CircleIcon />
      </IconButton>
      <Typography>{`T${index + 1}`}</Typography>
      <TextField inputRef={inputRef} type="number" value={value ?? ''} onChange={onChange} onBlur={onBlur} />
      <IconButton size="small" onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
}
