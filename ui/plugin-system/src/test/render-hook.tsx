import { renderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { ContextOptions, getTestContextWrapper } from './utils';

/**
 * Test helper to render a React hook with common app-level providers, including the PluginRegistry,
 * wrapped around it. Useful for testing hooks that rely on context such as QueryClientProvider or PluginRegistry.
 */
export function renderHookWithContext<TProps, TResult>(
  callback: (props: TProps) => TResult,
  contextOptions?: ContextOptions,
  renderHookOptions?: Omit<RenderHookOptions<TProps>, 'wrapper'>
): RenderHookResult<TResult, TProps> {
  const wrapper = getTestContextWrapper(contextOptions);
  return renderHook(callback, { wrapper, ...renderHookOptions });
}
