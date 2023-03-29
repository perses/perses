import { AnnotationEvent } from '@perses-dev/core';
import { createContext, useContext } from 'react';

export type AnnotationSrv = {
  annotations: AnnotationEvent[];
};

export const AnnotationContext = createContext<AnnotationSrv | undefined>(undefined);

export function useAnnotationContext() {
  const ctx = useContext(AnnotationContext);
  if (ctx === undefined) {
    throw new Error('No found AnnotationContext. Did you forget the AnnotationsProvider?');
  }
  return {
    annotations: ctx.annotations,
  };
}
