// Copyright 2021 The Perses Authors
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
	"encoding/json"
	"net/http"
)

var defaultPrometheusWhiteList = []HTTPWhiteListConfig{
	{
		Endpoint: "/api/v1/labels",
		Method:   http.MethodPost,
	},
	{
		Endpoint: "/api/v1/series",
		Method:   http.MethodPost,
	},
	{
		Endpoint: "/api/v1/metadata",
		Method:   http.MethodGet,
	},
	{
		Endpoint: "/api/v1/query",
		Method:   http.MethodPost,
	},
	{
		Endpoint: "/api/v1/query_range",
		Method:   http.MethodPost,
	},
}

type Prometheus struct {
	BasicDatasource `json:",inline" yaml:",inline"`
	HTTP            HTTPConfig `json:"http" yaml:"http"`
}

func (p *Prometheus) GetKind() Kind {
	return p.Kind
}

func (p *Prometheus) UnmarshalJSON(data []byte) error {
	var tmp Prometheus
	type plain Prometheus
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Prometheus) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Prometheus
	type plain Prometheus
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *Prometheus) validate() error {
	if p.HTTP.Access == ServerHTTPAccess && len(p.HTTP.WhiteList) == 0 {
		p.HTTP.WhiteList = defaultPrometheusWhiteList
	}
	return nil
}
