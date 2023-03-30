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

import React from 'react';
import { AnnotationEvent, AnnotationDefinition } from '@perses-dev/core';
import { AnnotationContext } from '@perses-dev/plugin-system';

export interface AnnotationsProviderProps {
  children: React.ReactNode;
  initialAnnotationDefinitions?: AnnotationDefinition[];
}

function useAnnotationSrvStore({
  initialAnnotationDefinitions = [],
}: {
  initialAnnotationDefinitions?: AnnotationDefinition[];
}) {
  const annotations: AnnotationEvent[] = [];
  initialAnnotationDefinitions.forEach((def) => {
    if (def.kind === 'StaticAnnotation') {
      annotations.push(...def.spec.annotations);
    }
  });

  return {
    annotationDefinitions: initialAnnotationDefinitions,
    annotations: annotations,
  };
}

export function AnnotationsProvider({ initialAnnotationDefinitions, children }: AnnotationsProviderProps) {
  const store = useAnnotationSrvStore({ initialAnnotationDefinitions });
  return (
    <AnnotationsSrvContext.Provider value={store}>
      <AnnotationContext.Provider value={{ annotations: store.annotations }}>{children}</AnnotationContext.Provider>
    </AnnotationsSrvContext.Provider>
  );
}

export const AnnotationsSrvContext = React.createContext<ReturnType<typeof useAnnotationSrvStore> | undefined>(
  undefined
);
