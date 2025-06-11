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

package common

import (
	"strings"
)

#joinByColumnValueTransform: {
	kind: "JoinByColumnValue"
	spec: {
		columns: [...string]
		disabled?: bool
	}
}

#mergeColumnsTransform: {
	kind: "MergeColumns"
	spec: {
		columns: [...string]
		name:      strings.MinRunes(1)
		disabled?: bool
	}
}

#mergeIndexedColumnsTransform: {
	kind: "MergeIndexedColumns"
	spec: {
		column:    strings.MinRunes(1)
		disabled?: bool
	}
}

#mergeSeries: {
	kind: "MergeSeries"
	spec: {
		disabled?: bool
	}
}

#transform: #joinByColumnValueTransform | #mergeColumnsTransform | #mergeIndexedColumnsTransform | #mergeSeries
