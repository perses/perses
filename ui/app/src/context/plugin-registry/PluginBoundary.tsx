import { ErrorBoundary, ErrorBoundaryProps } from 'react-error-boundary';
import {
  PluginLoadingBoundary,
  PluginLoadingBoundaryProps,
} from './PluginLoadingBoundary';

export interface PluginBoundaryProps {
  loadingFallback: PluginLoadingBoundaryProps['fallback'];
  ErrorFallbackComponent: Required<ErrorBoundaryProps>['FallbackComponent'];
  children: React.ReactNode;
}

/**
 * Combination ErrorBoundary and PluginLoadingBoundary.
 */
export function PluginBoundary(props: PluginBoundaryProps) {
  const { ErrorFallbackComponent, loadingFallback, children } = props;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
      <PluginLoadingBoundary fallback={loadingFallback}>
        {children}
      </PluginLoadingBoundary>
    </ErrorBoundary>
  );
}
