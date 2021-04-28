// Copyright 2021 Amadeus s.a.s
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

package v1

import (
	"encoding/json"
	"fmt"

	"github.com/prometheus/common/model"
)

type PromQueryResult struct {
	Err    error       `json:"err,omitempty"`
	Result model.Value `json:"result"`
}

type PanelFeedResponse struct {
	Name    string            `json:"name"`
	Order   uint64            `json:"order"`
	Results []PromQueryResult `json:"results"`
}

type SectionFeedResponse struct {
	// Name is the original name of the section from the Dashboard model.
	// It is used to associate the prometheus data to the section that initiate the request.
	// It is of course optional. If the name is empty, then the order is used know which section to fill with the Prometheus response.
	// It should be used as well by the UI to know which chart to fill with the response.
	Name   string              `json:"name,omitempty"`
	Order  uint64              `json:"order"`
	Panels []PanelFeedResponse `json:"panels"`
}

// SectionFeedRequest is the struct that represents the request performed by a client in order to get a set of data to feed a Dashboard.
type SectionFeedRequest struct {
	Datasource string             `json:"datasource"`
	Duration   model.Duration     `json:"duration"`
	Variables  map[string]string  `json:"variables"`
	Sections   []DashboardSection `json:"sections"`
}

func (d *SectionFeedRequest) UnmarshalJSON(data []byte) error {
	var tmp SectionFeedRequest
	type plain SectionFeedRequest
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*d = tmp
	return nil
}

func (d *SectionFeedRequest) validate() error {
	if len(d.Datasource) == 0 {
		return fmt.Errorf("datasource cannot be empty")
	}
	if len(d.Sections) == 0 {
		return fmt.Errorf("sections cannot be empty")
	}
	return nil
}
