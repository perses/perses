import { useMemo } from 'react';
import { createContext, useContext } from 'react';
import useResizeObserver from 'use-resize-observer';

export interface PanelContextType {
  contentDimensions?: {
    width: number;
    height: number;
  };
}

export const PanelContext = createContext<PanelContextType | undefined>(
  undefined
);

export interface PanelContextProviderProps {
  contentElement: HTMLDivElement | null;
  children: React.ReactNode;
}

export function PanelContextProvider(props: PanelContextProviderProps) {
  const { contentElement, children } = props;
  const { width, height } = useResizeObserver({ ref: contentElement });

  const context: PanelContextType = useMemo(() => {
    const contentDimensions =
      width !== undefined && height !== undefined
        ? { width, height }
        : undefined;
    return { contentDimensions };
  }, [width, height]);

  return (
    <PanelContext.Provider value={context}>{children}</PanelContext.Provider>
  );
}

export function usePanelContext() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error(`No Panel context found. Did you forget a Provider?`);
  }
  return context;
}
