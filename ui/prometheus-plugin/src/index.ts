// Copyright 2022 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { PrometheusGraphQuery } from './plugins/graph-query';
import { Interval } from './plugins/interval-variable';
import { PrometheusLabelNames } from './plugins/label-names-variable';
import { PrometheusLabelValues } from './plugins/label-values-variable';

// Export plugins under the same name as the kinds they handle from the plugin.json
export { PrometheusGraphQuery, Interval, PrometheusLabelNames, PrometheusLabelValues };
