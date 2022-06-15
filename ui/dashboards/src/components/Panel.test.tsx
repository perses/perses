import { render } from '@testing-library/react';
import { PanelDefinition } from '@perses-dev/core';
import { Panel } from './Panel';

const TEST_DEFINITION: PanelDefinition = {
  kind: '',
  display: {
    name: 'My test panel',
  },
  options: {},
};

describe('Panel', () => {
  it('should render Panel', () => {
    render(<Panel definition={TEST_DEFINITION} />);
  });
});
