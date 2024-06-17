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
	"testing"

	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/load"
	"github.com/perses/perses/internal/test"
	apiConfig "github.com/perses/perses/pkg/model/api/config"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
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
			schema: filepath.Join(projectPath, "cue", apiConfig.DefaultDatasourcesPath, "prometheus"),
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
			schema: filepath.Join(projectPath, "cue", apiConfig.DefaultDatasourcesPath, "tempo"),
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

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := cuecontext.New()
			buildInstances := load.Instances([]string{}, &load.Config{Dir: tt.schema, Package: "model"})
			// we strongly assume that only 1 buildInstance should be returned, otherwise we skip it
			if len(buildInstances) != 1 {
				logrus.Error("Plugin will not be loaded: The number of build instances is != 1")
				return
			}
			buildInstance := buildInstances[0]
			v := ctx.BuildInstance(buildInstance)
			trees, err := NewFromSchema(v)
			if err != nil {
				t.Errorf("NewFromSchema() error = %v", err)
				return
			}
			assert.Equal(t, tt.expected, trees)
		})
	}
}
