// Copyright 2025 The Perses Authors
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

import { createContext, ReactElement, useMemo, useState } from 'react';

export interface PanelEditor {
  preview: {
    previewPanelWidth?: number;
    setPreviewPanelWidth?: (width: number) => void;
  };
}

export interface PanelEditorProviderProps {
  children: React.ReactNode;
}

export const PanelEditorContext = createContext<PanelEditor | undefined>(undefined);

export const PanelEditorProvider = ({ children }: PanelEditorProviderProps): ReactElement => {
  const [previewPanelWidth, setPreviewPanelWidth] = useState<number | undefined>(undefined);

  const ctx = useMemo(
    (): PanelEditor => ({
      preview: {
        previewPanelWidth,
        setPreviewPanelWidth,
      },
    }),
    [previewPanelWidth, setPreviewPanelWidth]
  );

  return <PanelEditorContext.Provider value={ctx}>{children}</PanelEditorContext.Provider>;
};
