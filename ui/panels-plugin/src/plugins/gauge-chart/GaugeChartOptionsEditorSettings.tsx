import { CalculationSelector } from '@perses-dev/plugin-system';
import { produce } from 'immer';
import { DEFAULT_CALCULATION } from '@perses-dev/plugin-system';
import { Stack, Typography } from '@mui/material';
import { UnitSelector, UnitSelectorProps } from '@perses-dev/components';
import { GaugeChartOptionsEditorProps } from './GaugeChartOptionsEditor';
import { GaugeChartOptions, DEFAULT_UNIT } from './gauge-chart-model';

export function GaugeChartOptionsEditorSettings(props: GaugeChartOptionsEditorProps) {
  const { onChange, value } = props;

  const handleCalculationChange = (newCalculation: GaugeChartOptions['calculation']) => {
    onChange(
      produce(value, (draft: GaugeChartOptions) => {
        draft.calculation = newCalculation;
      })
    );
  };

  const handleUnitChange: UnitSelectorProps['onChange'] = (newUnit) => {
    onChange(
      produce(value, (draft: GaugeChartOptions) => {
        draft.unit = newUnit;
      })
    );
  };

  return (
    <Stack spacing={1} alignItems="flex-start">
      <Typography variant="overline" component="h4">
        Misc
      </Typography>
      <UnitSelector value={value.unit ?? DEFAULT_UNIT} onChange={handleUnitChange} />
      <CalculationSelector value={value.calculation ?? DEFAULT_CALCULATION} onChange={handleCalculationChange} />
    </Stack>
  );
}
