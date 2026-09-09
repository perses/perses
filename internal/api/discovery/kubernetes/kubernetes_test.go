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

package kubesd

import (
	"testing"

	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

func TestBuildLabelSelector(t *testing.T) {
	testSuite := []struct {
		name     string
		labels   map[string]string
		expected string
	}{
		{
			name:     "empty labels",
			labels:   map[string]string{},
			expected: "",
		},
		{
			name:     "single label with no value",
			labels:   map[string]string{"app": ""},
			expected: "app",
		},
		{
			name:     "single label with value",
			labels:   map[string]string{"app": "perses"},
			expected: "app=perses",
		},
		{
			name:     "multiple labels",
			labels:   map[string]string{"app": "perses", "env": "dev"},
			expected: "app=perses,env=dev",
		},
		{
			name:     "multiple labels with empty value",
			labels:   map[string]string{"app": "perses", "env": ""},
			expected: "app=perses,env",
		},
	}

	for _, test := range testSuite {
		t.Run(test.name, func(t *testing.T) {
			result := buildLabelSelector(test.labels)
			assert.Equal(t, test.expected, result)
		})
	}
}

func newDiscoveredDatasource(name string, labels, annotations map[string]string) *discoveredDatasource {
	return &discoveredDatasource{
		datasource:  &v1.GlobalDatasource{Metadata: v1.Metadata{Name: name}},
		labels:      labels,
		annotations: annotations,
	}
}

func TestResolveDefaultName_Disabled(t *testing.T) {
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Default: config.DiscoveryDefault{Enable: false},
		},
	}
	resources := []*discoveredDatasource{
		newDiscoveredDatasource("ns.prometheus", map[string]string{"app": "prometheus"}, nil),
	}
	assert.Equal(t, "", d.resolveDefaultName(resources))
}

func TestResolveDefaultName_NoMatch(t *testing.T) {
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Default: config.DiscoveryDefault{
				Enable: true,
				Labels: map[string]string{"app": "prometheus"},
			},
		},
	}
	resources := []*discoveredDatasource{
		newDiscoveredDatasource("ns.other", map[string]string{"app": "other"}, nil),
	}
	assert.Equal(t, "", d.resolveDefaultName(resources))
}

func TestResolveDefaultName_FirstMatch(t *testing.T) {
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Default: config.DiscoveryDefault{
				Enable: true,
				Labels: map[string]string{"app": "prometheus"},
			},
		},
	}
	resources := []*discoveredDatasource{
		newDiscoveredDatasource("ns.prometheus-1", map[string]string{"app": "prometheus"}, nil),
		newDiscoveredDatasource("ns.prometheus-2", map[string]string{"app": "prometheus"}, nil),
	}
	assert.Equal(t, "ns.prometheus-1", d.resolveDefaultName(resources))
}

func TestResolveDefaultName_AnnotationFilter(t *testing.T) {
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Default: config.DiscoveryDefault{
				Enable:      true,
				Labels:      map[string]string{"app": "prometheus"},
				Annotations: map[string]string{"default": "true"},
			},
		},
	}
	resources := []*discoveredDatasource{
		newDiscoveredDatasource("ns.prometheus-1", map[string]string{"app": "prometheus"}, map[string]string{"default": "false"}),
		newDiscoveredDatasource("ns.prometheus-2", map[string]string{"app": "prometheus"}, map[string]string{"default": "true"}),
	}
	assert.Equal(t, "ns.prometheus-2", d.resolveDefaultName(resources))
}

func TestResolveDefaultName_EmptyResources(t *testing.T) {
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Default: config.DiscoveryDefault{
				Enable: true,
				Labels: map[string]string{"app": "prometheus"},
			},
		},
	}
	assert.Equal(t, "", d.resolveDefaultName(nil))
}
