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
