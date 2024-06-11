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

package panel

import (
	"github.com/perses/perses/go-sdk/link"
	"github.com/perses/perses/go-sdk/query"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

func Title(title string) Option {
	return func(builder *Builder) error {
		builder.Spec.Display.Name = title
		return nil
	}
}

func Description(description string) Option {
	return func(builder *Builder) error {
		builder.Spec.Display.Description = description
		return nil
	}
}

func Plugin(plugin common.Plugin) Option {
	return func(builder *Builder) error {
		builder.Spec.Plugin = plugin
		return nil
	}
}

func AddQuery(options ...query.Option) Option {
	return func(builder *Builder) error {
		q, err := query.New(options...)
		if err != nil {
			return err
		}
		builder.Spec.Queries = append(builder.Spec.Queries, q.Query)
		return nil
	}
}

func AddLink(url string, options ...link.Option) Option {
	return func(builder *Builder) error {
		l, err := link.New(url, options...)
		if err != nil {
			return err
		}
		builder.Spec.Links = append(builder.Spec.Links, l.Link)
		return nil
	}
}
