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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
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

func newFakeService(namespace, name string, labels, annotations map[string]string) corev1.Service {
	return corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:        name,
			Namespace:   namespace,
			Labels:      labels,
			Annotations: annotations,
		},
	}
}

func newFakePod(namespace, name string, labels, annotations map[string]string) corev1.Pod {
	return corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:        name,
			Namespace:   namespace,
			Labels:      labels,
			Annotations: annotations,
		},
	}
}

func TestResolveDefaultName_Disabled(t *testing.T) {
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Default: config.DiscoveryDefault{Enable: false},
		},
		kubeClient: fake.NewClientset(),
	}
	name, err := d.resolveDefaultName()
	require.NoError(t, err)
	assert.Equal(t, "", name)
}

func TestResolveDefaultName_ServiceNoMatch(t *testing.T) {
	svc := newFakeService("ns", "prometheus", map[string]string{"app": "other"}, nil)
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Namespace:            "ns",
			ServiceConfiguration: config.KubeServiceDiscovery{Enable: true},
			Default: config.DiscoveryDefault{
				Enable: true,
				Labels: map[string]string{"app": "prometheus"},
			},
		},
		kubeClient: fake.NewClientset(&svc),
	}
	name, err := d.resolveDefaultName()
	require.NoError(t, err)
	assert.Equal(t, "", name)
}

func TestResolveDefaultName_ServiceFirstMatch(t *testing.T) {
	svc1 := newFakeService("ns", "prometheus-1", map[string]string{"app": "prometheus"}, nil)
	svc2 := newFakeService("ns", "prometheus-2", map[string]string{"app": "prometheus"}, nil)
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Namespace:            "ns",
			ServiceConfiguration: config.KubeServiceDiscovery{Enable: true},
			Default: config.DiscoveryDefault{
				Enable: true,
				Labels: map[string]string{"app": "prometheus"},
			},
		},
		kubeClient: fake.NewClientset(&svc1, &svc2),
	}
	name, err := d.resolveDefaultName()
	require.NoError(t, err)
	// The fake client returns objects in insertion order; first match wins.
	assert.Equal(t, "ns.prometheus-1", name)
}

func TestResolveDefaultName_ServiceAnnotationFilter(t *testing.T) {
	svc1 := newFakeService("ns", "prometheus-1", map[string]string{"app": "prometheus"}, map[string]string{"default": "false"})
	svc2 := newFakeService("ns", "prometheus-2", map[string]string{"app": "prometheus"}, map[string]string{"default": "true"})
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Namespace:            "ns",
			ServiceConfiguration: config.KubeServiceDiscovery{Enable: true},
			Default: config.DiscoveryDefault{
				Enable:      true,
				Labels:      map[string]string{"app": "prometheus"},
				Annotations: map[string]string{"default": "true"},
			},
		},
		kubeClient: fake.NewClientset(&svc1, &svc2),
	}
	name, err := d.resolveDefaultName()
	require.NoError(t, err)
	assert.Equal(t, "ns.prometheus-2", name)
}

func TestResolveDefaultName_PodFirstMatch(t *testing.T) {
	pod := newFakePod("ns", "prometheus-pod", map[string]string{"app": "prometheus"}, nil)
	d := &discovery{
		cfg: &config.KubernetesDiscovery{
			Namespace:         "ns",
			PodConfiguration:  config.KubePodDiscovery{Enable: true},
			Default: config.DiscoveryDefault{
				Enable: true,
				Labels: map[string]string{"app": "prometheus"},
			},
		},
		kubeClient: fake.NewClientset(&pod),
	}
	name, err := d.resolveDefaultName()
	require.NoError(t, err)
	assert.Equal(t, "ns.prometheus-pod", name)
}
