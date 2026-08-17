// Copyright The Perses Authors
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

package globaldatasource

import (
	"testing"

	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	datasourceSpec "github.com/perses/spec/go/datasource"
	"github.com/stretchr/testify/assert"
)

func newDS(name string, source v1.MetadataSource, discoveryName string) *v1.GlobalDatasource {
	return &v1.GlobalDatasource{
		Kind: v1.KindGlobalDatasource,
		Metadata: v1.DatasourceMetadata{
			Metadata:      v1.Metadata{Name: name},
			Source:        source,
			DiscoveryName: discoveryName,
		},
		Spec: datasourceSpec.Spec{},
	}
}

func TestList_SourceAndDiscoveryNameFiltering(t *testing.T) {
	all := []*v1.GlobalDatasource{
		newDS("ds-a1", v1.DiscoverySource, "kube-prod"),
		newDS("ds-a2", v1.DiscoverySource, "kube-prod"),
		newDS("ds-b1", v1.DiscoverySource, "kube-staging"),
		newDS("ds-manual", v1.ManualSource, ""),
	}

	tests := []struct {
		name          string
		query         globaldatasource.Query
		expectedNames []string
	}{
		{
			name:          "no filter returns all",
			query:         globaldatasource.Query{},
			expectedNames: []string{"ds-a1", "ds-a2", "ds-b1", "ds-manual"},
		},
		{
			name:          "source=discovery returns all discovery entries",
			query:         globaldatasource.Query{Source: v1.DiscoverySource},
			expectedNames: []string{"ds-a1", "ds-a2", "ds-b1"},
		},
		{
			name:          "source=discovery and discovery_name=kube-prod returns only kube-prod entries",
			query:         globaldatasource.Query{Source: v1.DiscoverySource, DiscoveryName: "kube-prod"},
			expectedNames: []string{"ds-a1", "ds-a2"},
		},
		{
			name:          "source=discovery and discovery_name=kube-staging returns only kube-staging entries",
			query:         globaldatasource.Query{Source: v1.DiscoverySource, DiscoveryName: "kube-staging"},
			expectedNames: []string{"ds-b1"},
		},
		{
			name:          "source=manual returns only manual entries",
			query:         globaldatasource.Query{Source: v1.ManualSource},
			expectedNames: []string{"ds-manual"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Call the filter logic directly, bypassing the database client.
			// This mirrors what dao.List does after d.client.Query populates result.
			result := applyListFilter(all, &tt.query)
			var names []string
			for _, ds := range result {
				names = append(names, ds.Metadata.Name)
			}
			assert.ElementsMatch(t, tt.expectedNames, names)
		})
	}
}
