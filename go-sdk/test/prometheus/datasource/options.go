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

package datasource

import (
	"github.com/perses/perses/go-sdk/http"
)

func DirectURL(url string) Option {
	return func(builder *Builder) error {
		builder.DirectURL = url
		return nil
	}
}

func HTTPProxy(url string, options ...http.Option) Option {
	return func(builder *Builder) error {
		p, err := http.New(url, options...)
		if err != nil {
			return err
		}
		builder.Proxy = &p.Proxy
		return nil
	}
}

func QueryParams(params map[string]string) Option {
	return func(builder *Builder) error {
		builder.QueryParams = params
		return nil
	}
}

func QueryParam(key, value string) Option {
	return func(builder *Builder) error {
		if builder.QueryParams == nil {
			builder.QueryParams = make(map[string]string)
		}
		builder.QueryParams[key] = value
		return nil
	}
}

// EnableExemplars enables exemplar support on the datasource: the Prometheus query plugin
// will also query the /api/v1/query_exemplars endpoint when running range queries.
func EnableExemplars() Option {
	return func(builder *Builder) error {
		builder.Exemplars = &Exemplars{Enable: true}
		return nil
	}
}
