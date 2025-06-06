// Copyright 2024 The Perses Authors
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

package cuetils

import (
	"sort"
	"testing"

	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/test"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/stretchr/testify/assert"
)

func TestNewFromSchema(t *testing.T) {
	tests := []struct {
		name     string
		schema   string
		expected []*Node
	}{
		{
			name:   "PrometheusDatasource",
			schema: "PrometheusDatasource",
			expected: []*Node{
				{
					Type:          StringNodeType,
					FieldName:     "kind",
					ConcreteValue: "PrometheusDatasource",
				},
				{
					Type:      StructNodeType,
					FieldName: "spec",
					Nodes: []*Node{
						{
							Type:      StringNodeType,
							FieldName: "directUrl",
						},
						{
							Type:      StructNodeType,
							FieldName: "proxy",
							Nodes: []*Node{
								{
									Type:          StringNodeType,
									FieldName:     "kind",
									ConcreteValue: "HTTPProxy",
								},
								{
									Type:      StructNodeType,
									FieldName: "spec",
									Nodes: []*Node{
										{
											Type:      StringNodeType,
											FieldName: "url",
										},
									},
								},
							},
						},
					},
				},
			},
		},
		{
			name:   "TempoDatasource",
			schema: "TempoDatasource",
			expected: []*Node{
				{
					Type:          StringNodeType,
					FieldName:     "kind",
					ConcreteValue: "TempoDatasource",
				},
				{
					Type:      StructNodeType,
					FieldName: "spec",
					Nodes: []*Node{
						{
							Type:      StringNodeType,
							FieldName: "directUrl",
						},
						{
							Type:      StructNodeType,
							FieldName: "proxy",
							Nodes: []*Node{
								{
									Type:          StringNodeType,
									FieldName:     "kind",
									ConcreteValue: "HTTPProxy",
								},
								{
									Type:      StructNodeType,
									FieldName: "spec",
									Nodes: []*Node{
										{
											Type:      StringNodeType,
											FieldName: "url",
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
	sch := plugin.StrictLoad().Schema()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := cuecontext.New()
			instance, err := sch.GetDatasourceSchema(tt.schema)
			if err != nil {
				t.Fatal(err)
			}
			trees, err := NewFromSchema(ctx.BuildInstance(instance))
			if err != nil {
				t.Fatalf("NewFromSchema() error = %v", err)
			}
			sortNodes(trees)
			assert.Equal(t, tt.expected, trees)
		})
	}
}

func TestBuildPluginAndInjectProxy(t *testing.T) {
	tests := []struct {
		name               string
		schema             string
		proxy              http.Config
		expectedYAMLResult string
	}{
		{
			name:   "PrometheusDatasource",
			schema: "PrometheusDatasource",
			proxy: http.Config{
				URL: common.MustParseURL("http://localhost:9090"),
			},
			expectedYAMLResult: `kind: PrometheusDatasource
spec:
    proxy:
        kind: HTTPProxy
        spec:
            url: http://localhost:9090
`,
		},
	}
	sch := plugin.StrictLoad().Schema()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := cuecontext.New()
			instance, err := sch.GetDatasourceSchema(tt.schema)
			if err != nil {
				t.Fatal(err)
			}
			trees, err := NewFromSchema(ctx.BuildInstance(instance))
			if err != nil {
				t.Fatalf("NewFromSchema() error = %v", err)
			}
			sortNodes(trees)
			plg, err := BuildPluginAndInjectProxy(trees, tt.proxy)
			if err != nil {
				t.Fatalf("BuildPluginAndInjectProxy() error = %v", err)
			}
			d := test.YAMLMarshalStrict(plg)
			assert.Equal(t, tt.expectedYAMLResult, string(d))
		})
	}
}

func sortNodes(nodes []*Node) {
	sort.Slice(nodes, func(i, j int) bool {
		return nodes[i].FieldName < nodes[j].FieldName
	})
	for _, node := range nodes {
		node.sort()
	}
}
