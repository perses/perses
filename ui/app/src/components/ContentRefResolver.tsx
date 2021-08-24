import {
  ContentRef,
  isLayoutRef,
  resolveLayoutRef,
  resolvePanelRef,
  useDashboardSpec,
} from '@perses-ui/core';
import ExpandLayout from './ExpandLayout';
import GridLayout from './GridLayout';
import Panel from './Panel';

export interface ContentRefResolverProps {
  contentRef: ContentRef;
}

/**
 * Resolves a ContentRef to a Layout or Panel definition and renders the
 * appropriate UI component for that definition.
 */
function ContentRefResolver(props: ContentRefResolverProps) {
  const spec = useDashboardSpec();

  if (isLayoutRef(props.contentRef)) {
    const definition = resolveLayoutRef(spec, props.contentRef);
    switch (definition.kind) {
      case 'expand':
        return <ExpandLayout definition={definition} />;
      case 'grid':
        return <GridLayout definition={definition} />;
      default:
        const exhaustive: never = definition;
        throw new Error(`Unhandled layout definition: ${exhaustive}`);
    }
  }

  const definition = resolvePanelRef(spec, props.contentRef);
  return <Panel definition={definition} />;
}

export default ContentRefResolver;
