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

package query

import (
	"fmt"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
)

type Option struct {
	Kind   plugin.Kind
	Plugin common.Plugin
	Error  error
}

func New(option Option) (*v1.Query, error) {
	if !option.Kind.IsQuery() {
		return nil, fmt.Errorf("invalid plugin kind for a query: %s", option.Kind)
	}
	return &v1.Query{
		Kind: string(option.Kind),
		Spec: v1.QuerySpec{
			Plugin: option.Plugin,
		},
	}, option.Error
}
