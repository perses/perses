import { ErrorBoundary } from 'react-error-boundary';
import AlertErrorFallback from './AlertErrorFallback';

export interface AlertErrorBoundaryProps {
  children?: React.ReactNode;
}

/**
 * ErrorBoundary that shows the AlertErrorFallback when it catches an Error.
 */
function AlertErrorBoundary(props: AlertErrorBoundaryProps) {
  const { children } = props;
  return (
    <ErrorBoundary FallbackComponent={AlertErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}

export default AlertErrorBoundary;
