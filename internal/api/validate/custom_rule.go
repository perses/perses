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

package validate

import (
	"encoding/json"
	"fmt"

	"github.com/perses/perses/pkg/model/api/config"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func convertDashboardToJSONRaw(dash *modelV1.Dashboard) (map[string]interface{}, error) {
	data, err := json.Marshal(dash)
	if err != nil {
		return nil, fmt.Errorf("error while marshalling the dashboard: %w", err)
	}
	var jsonRaw map[string]interface{}
	return jsonRaw, json.Unmarshal(data, &jsonRaw)
}

func DashboardWithCustomRules(dash *modelV1.Dashboard, customRules []*config.CustomLintRule) error {
	if len(customRules) == 0 || dash == nil {
		return nil
	}
	jsonRaw, err := convertDashboardToJSONRaw(dash)
	if err != nil {
		return err
	}
	for _, rule := range customRules {
		if rule.Disable {
			continue
		}
		if evaluateErr := rule.Evaluate(jsonRaw); evaluateErr != nil {
			return evaluateErr
		}
	}
	return nil
}
