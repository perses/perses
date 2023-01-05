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

package fakev1

import (
	v1 "github.com/perses/perses/pkg/client/api/v1"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type health struct {
	v1.HealthInterface
}

func (c *health) Check() (*modelV1.Health, error) {
	return &modelV1.Health{
		BuildTime: "2022-03-23",
		Version:   "v0.1.0",
		Commit:    "ff30323938a15cfa9df3071bb84e3f3ef75153df",
		Database:  false,
	}, nil
}
