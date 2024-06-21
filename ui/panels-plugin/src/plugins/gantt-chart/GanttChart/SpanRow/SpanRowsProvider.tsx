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

import { createContext, useContext, useState } from 'react';

interface SpanRowsContextType {
  collapsedSpans: string[];
  setCollapsedSpans: (s: string[]) => void;
  visibleSpans: string[];
  setVisibleSpans: (s: string[]) => void;
  /** can be a spanId, an empty string for the root span or undefined for no hover */
  hoveredParent?: string;
  setHoveredParent: (s?: string) => void;
}

/**
 * SpanRowsContext stores UI state of the rows.
 * Required for passing down state to deeply nested <SpanIndents>,
 * without re-rendering intermediate components.
 */
export const SpanRowsContext = createContext<SpanRowsContextType | undefined>(undefined);

interface SpanRowsProviderProps {
  children?: React.ReactNode;
}

export function SpanRowsProvider(props: SpanRowsProviderProps) {
  const { children } = props;
  const [collapsedSpans, setCollapsedSpans] = useState<string[]>([]);
  const [visibleSpans, setVisibleSpans] = useState<string[]>([]);
  const [hoveredParent, setHoveredParent] = useState<string | undefined>(undefined);

  return (
    <SpanRowsContext.Provider
      value={{ collapsedSpans, setCollapsedSpans, visibleSpans, setVisibleSpans, hoveredParent, setHoveredParent }}
    >
      {children}
    </SpanRowsContext.Provider>
  );
}

export function useSpanRowsContext(): SpanRowsContextType {
  const ctx = useContext(SpanRowsContext);
  if (ctx === undefined) {
    throw new Error('No SpanRowsContext found. Did you forget a Provider?');
  }
  return ctx;
}
