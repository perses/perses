import { Alert } from '@material-ui/core';
import { FallbackProps } from 'react-error-boundary';

/**
 * Fallback for ErrorBoundary that shows an MUI Alert with the `Error.message`
 * as its contents.
 */
function AlertErrorFallback(props: FallbackProps) {
  const { error } = props;
  return <Alert severity="error">{error.message}</Alert>;
}

export default AlertErrorFallback;
