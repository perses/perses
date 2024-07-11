import {
  DensitySelector,
  OptionsEditorColumn,
  OptionsEditorGrid,
  OptionsEditorGroup,
  SortOption,
  SortSelector,
  TableDensity,
} from '@perses-dev/components';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { TableOptions } from './table-model';

export type TableSettingsEditorProps = OptionsEditorProps<TableOptions>;

export function TableSettingsEditor({ onChange, value }: TableSettingsEditorProps) {
  function handleDensityChange(density: TableDensity): void {
    onChange({ ...value, density: density });
  }

  function handleSortChange(sort: SortOption): void {
    onChange({ ...value, sort: sort });
  }

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Display">
          <DensitySelector value={value.density} onChange={handleDensityChange} />
          <SortSelector value={value.sort} onChange={handleSortChange} />
        </OptionsEditorGroup>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
