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

package prometheus

import (
	"github.com/perses/perses/schemas/datasources/common"
)

#Datasource: {
	kind: "Prometheus"
	spec: {
		direct_url: string
		proxy?:     common.HTTPPRoxy & {
			allowed_endpoints: [
				{
					endpoint_pattern: "/api/v1/labels"
					method:           "POST"
				},
				{
					endpoint_pattern: "/api/v1/series"
					method:           "POST"
				},
				{
					endpoint_pattern: "/api/v1/metadata"
					method:           "GET"
				},
				{
					endpoint_pattern: "/api/v1/query"
					method:           "POST"
				},
				{
					endpoint_pattern: "/api/v1/query_range"
					method:           "POST"
				},
				{
					endpoint_pattern: "/api/v1/label/([a-zA-Z0-9_-]+)/values"
					method:           "GET"
				},
			]
		}
	}
}
