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
	"path/filepath"
	"sort"
	"testing"

	"cuelang.org/go/cue/cuecontext"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/test"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/datasource/http"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

func TestNewFromSchema(t *testing.T) {
	projectPath := test.GetRepositoryPath()
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

	cfg := apiConfig.Plugin{
		Path:        filepath.Join(projectPath, apiConfig.DefaultPluginPath),
		ArchivePath: filepath.Join(projectPath, apiConfig.DefaultArchivePluginPath),
	}
	pluginService := plugin.New(cfg)
	if err := pluginService.UnzipArchives(); err != nil {
		logrus.Fatal(err)
	}
	if err := pluginService.Load(); err != nil {
		logrus.Fatal(err)
	}
	sch := pluginService.Schema()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := cuecontext.New(cuecontext.EvaluatorVersion(cuecontext.EvalV3))
			instance, err := sch.GetDatasourceSchema(tt.schema)
			if err != nil {
				t.Error(err)
				return
			}
			trees, err := NewFromSchema(ctx.BuildInstance(instance))
			if err != nil {
				t.Errorf("NewFromSchema() error = %v", err)
				return
			}
			sortNodes(trees)
			assert.Equal(t, tt.expected, trees)
		})
	}
}

func TestBuildPluginAndInjectProxy(t *testing.T) {
	projectPath := test.GetRepositoryPath()
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
    directUrl: ""
    proxy:
        kind: HTTPProxy
        spec:
            url: http://localhost:9090
`,
		},
	}
	cfg := apiConfig.Plugin{
		Path:        filepath.Join(projectPath, apiConfig.DefaultPluginPath),
		ArchivePath: filepath.Join(projectPath, apiConfig.DefaultArchivePluginPath),
	}
	pluginService := plugin.New(cfg)
	if err := pluginService.UnzipArchives(); err != nil {
		logrus.Fatal(err)
	}
	if err := pluginService.Load(); err != nil {
		logrus.Fatal(err)
	}
	sch := pluginService.Schema()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := cuecontext.New(cuecontext.EvaluatorVersion(cuecontext.EvalV3))
			instance, err := sch.GetDatasourceSchema(tt.schema)
			if err != nil {
				t.Error(err)
				return
			}
			trees, err := NewFromSchema(ctx.BuildInstance(instance))
			if err != nil {
				t.Errorf("NewFromSchema() error = %v", err)
				return
			}
			sortNodes(trees)
			plg, err := BuildPluginAndInjectProxy(trees, tt.proxy)
			if err != nil {
				t.Errorf("BuildPluginAndInjectProxy() error = %v", err)
				return
			}
			d, err := yaml.Marshal(plg)
			if err != nil {
				t.Errorf("yaml.Marshal() error = %v", err)
			}
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
