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

	"github.com/perses/common/async"
)

func NewCronTask(rbacService RBAC) async.SimpleTask {
	return &rbacTask{svc: rbacService}
}

type rbacTask struct {
	async.SimpleTask
	svc RBAC
}

func (r *rbacTask) Execute(_ context.Context, _ context.CancelFunc) error {
	return r.svc.Refresh()
}

func (r *rbacTask) String() string {
	return "rbac refresh cache"
}
