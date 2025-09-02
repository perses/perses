// Copyright 2024 The Perses Authors
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

import { z } from 'zod';
import { ReactElement, useCallback, useMemo } from 'react';
import { parseAsJson, useQueryState } from 'nuqs';
import { DashboardProvider, DashboardProviderProps } from './DashboardProvider';
import { VirtualPanelRef } from './view-panel-slice';

export function DashboardProviderWithQueryParams({ children, initialState }: DashboardProviderProps): ReactElement {
  const [viewPanelRef, setViewPanelRef] = useQueryState(
    'viewPanelRef',
    parseAsJson(
      z
        .object({
          ref: z.string(),
          repeatVariable: z.tuple([z.string(), z.string()]).optional(),
        })
        .optional()
    )
  );

  // nuqs returns null when the query param is not present, but our state expects undefined when not present
  const viewPanelRefNotNull = useMemo(() => {
    return viewPanelRef ?? undefined;
  }, [viewPanelRef]);

  const handleSetViewPanelRef = useCallback(
    (panelRef: VirtualPanelRef | undefined) => {
      if (panelRef) {
        return setViewPanelRef(panelRef);
      }
      return setViewPanelRef(null);
    },
    [setViewPanelRef]
  );

  return (
    <DashboardProvider
      initialState={{
        ...initialState,
        viewPanelRef: viewPanelRefNotNull,
        setViewPanelRef: handleSetViewPanelRef,
      }}
    >
      {children}
    </DashboardProvider>
  );
}
