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

package rbac

import (
	"context"

	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type DisabledImpl struct{}

func (r *DisabledImpl) IsEnabled() bool {
	return false
}

func (r *DisabledImpl) HasPermission(_ string, _ v1.ActionKind, _ string, _ v1.Kind) bool {
	return true
}

func (r *DisabledImpl) Refresh() error {
	return nil
}

func (r *DisabledImpl) Execute(_ context.Context, _ context.CancelFunc) error {
	return nil
}

func (r *DisabledImpl) String() string {
	return "disabled RBAC"
}
