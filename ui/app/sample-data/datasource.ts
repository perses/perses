import { DataSourceResource } from '@perses-ui/core';

const dataSource: DataSourceResource = {
  kind: 'DataSource',
  metadata: {
    name: 'PromLabs Prometheus',
  },
  spec: {
    data_source: {
      kind: 'PrometheusDataSource',
      display: {},
      options: { base_url: 'https://prometheus.demo.do.prometheus.io' },
    },
  },
};

export default dataSource;
