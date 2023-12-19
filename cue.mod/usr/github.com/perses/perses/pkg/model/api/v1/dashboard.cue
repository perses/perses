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

package v1

import (
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/dashboard"
)

#PanelDisplay: {
	name:         string @go(Name)
	description?: string @go(Description)
}

#Panel: {
	kind: "Panel"
}

#DashboardSpec: {
	display?:         common.#Display           @go(Display)
	datasources?:     [string]: #DatasourceSpec @go(Datasources)
	variables?:       [...dashboard.#Variable]  @go(Variables,[]Variable)
	panels:           [string]: #Panel          @go(Panels)
	layouts:          [...dashboard.#Layout]    @go(Layouts,[]Layout)
	duration:         _ | *"1h"                 @go(Duration)        // TODO def should come from github.com/prometheus/common/model 
	refreshInterval?: _                         @go(RefreshInterval) // TODO def should come from github.com/prometheus/common/model
}

#Dashboard: {
	kind:     #KindDashboard   @go(Kind)
	metadata: #ProjectMetadata @go(Metadata)
	spec:     #DashboardSpec   @go(Spec)
}
