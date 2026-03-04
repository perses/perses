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

package dashboard

import (
	"fmt"
	"time"

	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

type Option func(dashboard *Builder) error

func New(name string, options ...Option) (Builder, error) {
	builder := &Builder{
		Dashboard: v1.Dashboard{
			Kind: v1.KindDashboard,
		},
	}
	builder.Dashboard.Metadata.Name = name

	defaults := []Option{
		Duration(time.Hour),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	if err := common.ValidateID(builder.Dashboard.Metadata.Name); err != nil {
		return *builder, fmt.Errorf("invalid dashboard metadata name %q: %w", builder.Dashboard.Metadata.Name, err)
	}

	return *builder, nil
}

type Builder struct {
	Dashboard v1.Dashboard `json:"-" yaml:"-"`
}
