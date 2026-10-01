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

package dashboard_test

import (
	"testing"

	"github.com/perses/perses/go-sdk/annotation"
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/spec/go/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAddAnnotation(t *testing.T) {
	builder, err := dashboard.New("dashboard", dashboard.AddAnnotation("Deployments",
		annotation.Plugin(plugin.Plugin{Kind: "TestAnnotation"}),
		annotation.Description("Production deployments"),
	))

	require.NoError(t, err)
	require.Len(t, builder.Dashboard.Spec.Annotations, 1)
	assert.Equal(t, "Deployments", builder.Dashboard.Spec.Annotations[0].Display.Name)
	assert.Equal(t, "Production deployments", builder.Dashboard.Spec.Annotations[0].Display.Description)
}
