// Copyright The Perses Authors
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

package refresh

import (
	"context"
	"errors"
	"testing"

	"github.com/perses/perses/internal/api/database/model"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/stretchr/testify/assert"
)

type fakeDAO struct {
	model.DAO
	latestUpdateTime *string
	err              error
}

func (f *fakeDAO) GetLatestUpdateTime(_ []modelV1.Kind) (*string, error) {
	return f.latestUpdateTime, f.err
}

func TestExecute_ReturnErrorWhenLatestUpdateTimeFails(t *testing.T) {
	dbErr := errors.New("database unavailable")
	refreshCalls := 0
	task := New(&fakeDAO{err: dbErr}, func() error {
		refreshCalls++
		return nil
	}, []modelV1.Kind{modelV1.KindDashboard})

	err := task.Execute(context.Background(), func() {})
	assert.ErrorIs(t, err, dbErr)
	assert.Equal(t, 0, refreshCalls)
}

func TestExecute_ReturnErrorWhenLatestUpdateTimeIsInvalid(t *testing.T) {
	invalidTime := "not a time"
	task := New(&fakeDAO{latestUpdateTime: &invalidTime}, func() error {
		return nil
	}, []modelV1.Kind{modelV1.KindDashboard})

	assert.Error(t, task.Execute(context.Background(), func() {}))
}

func TestExecute_RefreshAgainAfterAFailure(t *testing.T) {
	refreshErr := errors.New("refresh failed")
	latestUpdateTime := "2026-11-05 10:00:00"
	refreshCalls := 0
	task := New(&fakeDAO{latestUpdateTime: &latestUpdateTime}, func() error {
		refreshCalls++
		if refreshCalls == 1 {
			return refreshErr
		}
		return nil
	}, []modelV1.Kind{modelV1.KindDashboard})

	// The refresh fails, so the error is returned to be logged by the task runner.
	assert.ErrorIs(t, task.Execute(context.Background(), func() {}), refreshErr)
	// The previous refresh failed, so it is done again at the next execution.
	assert.NoError(t, task.Execute(context.Background(), func() {}))
	assert.Equal(t, 2, refreshCalls)
	// Nothing changed since the last successful refresh.
	assert.NoError(t, task.Execute(context.Background(), func() {}))
	assert.Equal(t, 2, refreshCalls)
}
