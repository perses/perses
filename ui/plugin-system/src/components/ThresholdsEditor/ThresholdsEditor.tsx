import React, { RefObject, useEffect, useRef, useState } from 'react';
import produce from 'immer';
import { IconButton, styled, TextField, Typography } from '@mui/material';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PlusIcon from 'mdi-material-ui/Plus';
import CircleIcon from 'mdi-material-ui/Circle';
import { Stack } from '@mui/system';
import { ColorPicker, OptionsEditorGroup, useChartsTheme } from '@perses-dev/components';
import { ThresholdOptions } from '../../model/thresholds';

interface ThresholdsEditorProps {
  thresholds?: ThresholdOptions;
  onChange: (thresholds: ThresholdOptions) => void;
}

export function ThresholdsEditor({ thresholds, onChange }: ThresholdsEditorProps) {
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

  const handleThresholdChange: (e: React.ChangeEvent<HTMLInputElement>, i: number) => void = (e, i) => {
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
    }
  };

  // sort thresholds in descending order every time an input blurs
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
        steps: [{ value: 10 }],
      });
    } else {
      onChange(
        produce(thresholds, (draft) => {
          const steps = draft.steps;
          if (steps?.length) {
            const lastStep = steps[steps.length - 1];
            const color = palette[steps.length] ?? getRandomColor(); // we will assign color from the palette first, then randomly generate color
            steps.push({ color, value: (lastStep?.value ?? 0) + 10 });
          } else if (steps) {
            steps.push({ value: 10 });
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
      {steps &&
        steps
          .map((step, i) => (
            <ThresholdInput
              inputRef={i === steps.length - 1 ? recentlyAddedInputRef : undefined}
              key={i}
              index={i}
              color={step.color ?? palette[i] ?? defaultThresholdColor}
              value={step.value}
              onColorChange={(color) => handleThresholdColorChange(color, i)}
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
        <ThresholdColorPicker color={defaultThresholdColor} onColorChange={handleDefaultColorChange} />
        <Typography>Default</Typography>
      </Stack>
    </OptionsEditorGroup>
  );
}

interface ThresholdInputProps {
  index: number;
  color: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorChange: (color: string) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

function ThresholdInput({
  inputRef,
  index,
  color,
  value,
  onChange,
  onColorChange,
  onBlur,
  onDelete,
}: ThresholdInputProps) {
  return (
    <Stack flex={1} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <ThresholdColorPicker color={color} onColorChange={onColorChange} />
      <Typography>{`T${index + 1}`}</Typography>
      <TextField inputRef={inputRef} type="number" value={value} onChange={onChange} onBlur={onBlur} />
      <IconButton size="small" onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  );
}

function ThresholdColorPicker({ color, onColorChange }: Pick<ThresholdInputProps, 'color' | 'onColorChange'>) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const {
    thresholds: { defaultColor, palette },
  } = useChartsTheme();

  return (
    <>
      <ColorIconButton
        size="small"
        aria-label="change threshold color"
        iconColor={color}
        isSelected={isOpen}
        onClick={handleClick}
      >
        <CircleIcon />
      </ColorIconButton>
      <ColorPicker
        initialColor={color}
        onColorChange={onColorChange}
        palette={[defaultColor, ...palette]}
        open={isOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      />
    </>
  );
}

const ColorIconButton = styled(IconButton)<{ iconColor?: string; isSelected?: boolean }>(
  ({ iconColor, isSelected }) => ({
    color: iconColor,
    backgroundColor: isSelected && iconColor ? `${iconColor}3F` : 'undefined', // 3F represents 25% opacity
  })
);

// https://www.paulirish.com/2009/random-hex-color-code-snippets/
const getRandomColor = () => {
  return (
    '#' +
    Math.floor(Math.random() * 16777216)
      .toString(16)
      .padStart(6, '0')
  );
};
