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

package config

import (
	"fmt"
	"slices"

	v1 "github.com/perses/perses/pkg/model/api/v1"
)

var watchableKinds = []v1.Kind{v1.KindDashboard}

type Watch struct {
	Kinds []v1.Kind `json:"kinds,omitempty" yaml:"kinds,omitempty"`
}

func (w *Watch) IsEnabled(kind v1.Kind) bool {
	return slices.Contains(w.Kinds, kind)
}

func (w *Watch) Verify() error {
	for _, k := range w.Kinds {
		if !slices.Contains(watchableKinds, k) {
			return fmt.Errorf("kind %q is not watchable", k)
		}
	}
	return nil
}
