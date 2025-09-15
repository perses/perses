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
import { ReactElement, useState } from 'react';
import { Layouts, Layout } from 'react-grid-layout';
import { PanelGroupId } from '@perses-dev/core';
import { useVariableValues, VariableContext } from '@perses-dev/plugin-system';
import {
  useEditMode,
  usePanelGroup,
  usePanelGroupActions,
  useViewPanelGroup,
  PanelGroupDefinition,
} from '../../context';
import { GRID_LAYOUT_SMALL_BREAKPOINT } from '../../constants';
import { PanelOptions } from '../Panel';
import { Row, RowProps } from './Row';

export interface GridLayoutProps {
  panelGroupId: PanelGroupId;
  panelOptions?: PanelOptions;
  panelFullHeight?: number;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
export function GridLayout(props: GridLayoutProps): ReactElement {
  const { panelGroupId, panelOptions, panelFullHeight } = props;
  const groupDefinition: PanelGroupDefinition = usePanelGroup(panelGroupId);
  const { updatePanelGroupLayouts } = usePanelGroupActions(panelGroupId);
  const viewPanelItemId = useViewPanelGroup();
  const { isEditMode } = useEditMode();

  const [gridColWidth, setGridColWidth] = useState(0);

  const hasViewPanel = viewPanelItemId?.panelGroupId === panelGroupId; // current panelGroup contains the panel extended?

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts): void => {
    // Using the value from `allLayouts` instead of `currentLayout` because of
    // a bug in react-layout-grid where `currentLayout` does not adjust properly
    // when going to a smaller breakpoint and then back to a larger breakpoint.
    // https://github.com/react-grid-layout/react-grid-layout/issues/1663
    const smallLayout = allLayouts[GRID_LAYOUT_SMALL_BREAKPOINT];
    if (smallLayout && !hasViewPanel) {
      updatePanelGroupLayouts(smallLayout);
    }
  };

  /**
   * Calculate the column width so we can determine the width of each panel for suggested step ms
   * https://github.com/react-grid-layout/react-grid-layout/blob/master/lib/calculateUtils.js#L14-L35
   */
  const handleWidthChange = (
    containerWidth: number,
    margin: [number, number],
    cols: number,
    containerPadding: [number, number]
  ): void => {
    const marginX = margin[0];
    const marginWidth = marginX * (cols - 1);
    const containerPaddingWidth = containerPadding[0] * 2;
    // exclude margin and padding from total width
    setGridColWidth((containerWidth - marginWidth - containerPaddingWidth) / cols);
  };

  return (
    <>
      {!groupDefinition.repeatVariable ? (
        <Row
          panelGroupId={panelGroupId}
          groupDefinition={groupDefinition}
          gridColWidth={gridColWidth}
          panelFullHeight={panelFullHeight}
          panelOptions={panelOptions}
          isEditMode={isEditMode}
          onLayoutChange={handleLayoutChange}
          onWidthChange={handleWidthChange}
        />
      ) : (
        <RepeatGridLayout
          repeatVariableName={groupDefinition.repeatVariable}
          panelGroupId={panelGroupId}
          groupDefinition={groupDefinition}
          gridColWidth={gridColWidth}
          panelFullHeight={panelFullHeight}
          panelOptions={panelOptions}
          isEditMode={isEditMode}
          onLayoutChange={handleLayoutChange}
          onWidthChange={handleWidthChange}
        />
      )}
    </>
  );
}

export interface RepeatGridLayoutProps extends RowProps {
  repeatVariableName: string;
}

/**
 * Renders a grid layout for a repeated variable, where each value of the variable will create a new row.
 */
export function RepeatGridLayout({
  repeatVariableName,
  panelGroupId,
  groupDefinition,
  gridColWidth,
  panelFullHeight,
  panelOptions,
  isEditMode = false,
  onLayoutChange,
  onWidthChange,
}: RepeatGridLayoutProps): ReactElement | null {
  const variables = useVariableValues();
  const variable = variables[repeatVariableName];

  // If the variable is not defined, or if it is defined but has no values, render a standard row without repeating
  if (variable === undefined || !Array.isArray(variable.value) || variable.value.length === 0) {
    return (
      <Row
        panelGroupId={panelGroupId}
        groupDefinition={groupDefinition}
        gridColWidth={gridColWidth}
        panelFullHeight={panelFullHeight}
        panelOptions={panelOptions}
        isEditMode={isEditMode}
        onLayoutChange={onLayoutChange}
        onWidthChange={onWidthChange}
      />
    );
  }

  return (
    <>
      {variable.value.map((value) => (
        <VariableContext.Provider
          key={`${repeatVariableName}-${value}`}
          value={{ state: { ...variables, [repeatVariableName]: { value, loading: false } } }}
        >
          <Row
            panelGroupId={panelGroupId}
            groupDefinition={groupDefinition}
            gridColWidth={gridColWidth}
            panelFullHeight={panelFullHeight}
            panelOptions={panelOptions}
            isEditMode={isEditMode}
            onLayoutChange={onLayoutChange}
            onWidthChange={onWidthChange}
            repeatVariable={[repeatVariableName, value]}
          />
        </VariableContext.Provider>
      ))}
    </>
  );
}
