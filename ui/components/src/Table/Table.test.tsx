import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { Table } from './Table';

type RenderTableOpts = {};

const renderTable = ({}: RenderTableOpts = {}) => {
  return render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 100 }}>
      <Table />
    </VirtuosoMockContext.Provider>
  );
};

describe('Table', () => {});
