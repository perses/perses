// Copyright 2022 The Perses Authors
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

package schemas

import (
	"context"

	"github.com/perses/common/async"
	log "github.com/sirupsen/logrus"
)

type reloader struct {
	async.Task
	validator Validator
}

func NewReloader(v Validator) async.SimpleTask {
	return &reloader{
		validator: v,
	}
}

// Initialize implements async.Task.Initialize
func (r *reloader) Initialize() error {
	return r.validator.Initialize()
}

// String implements fmt.Stringer
func (r *reloader) String() string {
	return "schemas reloader"
}

// Execute implements cron.Executor.Execute
func (r *reloader) Execute(ctx context.Context, _ context.CancelFunc) error {
	select {
	case <-ctx.Done():
		log.Infof("canceled %s", r.String())
		break
	default:
		r.validator.LoadSchemas()
	}
	return nil
}

// Finalize implements async.Task.Finalize
func (r *reloader) Finalize() error {
	// nothing to do
	return nil
}
