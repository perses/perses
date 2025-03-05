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

package migrate

import (
	commonMigrate "github.com/perses/perses/cue/common/migrate"
)

#grafanaType: "bargauge"
#panel:       _

kind: "BarChart"
spec: {
	calculation: *commonMigrate.#mapping.calc[#panel.options.reduceOptions.calcs[0]] | commonMigrate.#defaultCalc // only consider [0] here as Perses's GaugeChart doesn't support individual calcs

	#unit: *commonMigrate.#mapping.unit[#panel.fieldConfig.defaults.unit] | null
	if #unit != null {
		format: unit: #unit
	}
	#decimal: *#panel.fieldConfig.defaults.decimal | *#panel.fieldConfig.defaults.decimals | null
	if #decimal != null {
		format: {
			decimalPlaces: #decimal
			if #unit == null {
				unit: "decimal"
			}
		}
	}
}
