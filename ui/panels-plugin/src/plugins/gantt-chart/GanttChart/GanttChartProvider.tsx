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

import { createContext, useState } from 'react';

interface GanttChartContextType {
  collapsedSpans: string[];
  setCollapsedSpans: (s: string[]) => void;
  hoveredParent?: string; // can be a spanId, an empty string for the root span or undefined for no hover
  setHoveredParent: (s?: string) => void;
}

export const GanttChartContext = createContext<GanttChartContextType>({
  collapsedSpans: [],
  setCollapsedSpans: () => null,
  hoveredParent: '',
  setHoveredParent: () => null,
});

interface GanttChartProviderProps {
  children?: React.ReactNode;
}

export function GanttChartProvider(props: GanttChartProviderProps) {
  const { children } = props;
  const [collapsedSpans, setCollapsedSpans] = useState<string[]>([]);
  const [hoveredParent, setHoveredParent] = useState<string | undefined>(undefined);

  return (
    <GanttChartContext.Provider value={{ collapsedSpans, setCollapsedSpans, hoveredParent, setHoveredParent }}>
      {children}
    </GanttChartContext.Provider>
  );
}
