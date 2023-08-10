// Copyright 2023 The Perses Authors
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

//go:build integration

package api

import (
	"testing"

	e2eframework "github.com/perses/perses/internal/api/e2e/framework"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/pkg/model/api"
)

func TestMainScenarioGlobalDatasource(t *testing.T) {
	e2eframework.MainTestScenario(t, shared.PathGlobalDatasource, func(name string) api.Entity {
		return e2eframework.NewGlobalDatasource(t, name)
	})
}
