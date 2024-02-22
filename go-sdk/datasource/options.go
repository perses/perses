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

package datasource

import "github.com/perses/perses/pkg/model/api/v1/common"

func Name(name string) Option {
	return func(datasource *Builder) error {
		datasource.Metadata.Name = name
		return nil
	}
}

func ProjectName(name string) Option {
	return func(datasource *Builder) error {
		datasource.Metadata.Project = name
		return nil
	}
}

func Default(isDefault bool) Option {
	return func(datasource *Builder) error {
		datasource.Spec.Default = isDefault
		return nil
	}
}

func Plugin(plugin common.Plugin) Option {
	return func(datasource *Builder) error {
		datasource.Spec.Plugin = plugin
		return nil
	}
}
