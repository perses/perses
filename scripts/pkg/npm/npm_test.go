// Copyright 2025 The Perses Authors
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

package npm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetPackage(t *testing.T) {
	expectedPkg := Package{
		Name:    "perses-test",
		Version: "0.1.0",
		Workspaces: []string{
			"foo",
			"bar",
			"octopus",
		},
	}
	pkg, err := GetPackage(".")
	assert.NoError(t, err)
	assert.Equal(t, expectedPkg, pkg)
}

func TestGetWorkspaces(t *testing.T) {
	workspaces, err := GetWorkspaces(".")
	assert.NoError(t, err)
	expectedWorkspaces := []string{"foo", "bar", "octopus"}
	assert.Equal(t, expectedWorkspaces, workspaces)
}

func TestGetVersion(t *testing.T) {
	version, err := GetVersion(".")
	assert.NoError(t, err)
	assert.Equal(t, "0.1.0", version)
}
