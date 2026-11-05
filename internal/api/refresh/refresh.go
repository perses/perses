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
	"fmt"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/database/model"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

// New returns a task refreshing a cache when one of the given kinds has been updated.
// The name identifies the cache in the logs.
func New(name string, persesDAO model.DAO, refresh func() error, listToCheck []modelV1.Kind) async.SimpleTask {
	return &task{name: name, persesDAO: persesDAO, refresh: refresh, listToCheck: listToCheck}
}

type task struct {
	async.SimpleTask
	name            string
	refresh         func() error
	persesDAO       model.DAO
	lastRefreshTime time.Time
	listToCheck     []modelV1.Kind
}

func (r *task) Execute(_ context.Context, _ context.CancelFunc) error {
	lastUpdateTime, err := r.persesDAO.GetLatestUpdateTime(r.listToCheck)
	if err != nil {
		return fmt.Errorf("failed to retrieve last update time: %w", err)
	}

	// If tables have never been updated, using older date than now and that can't be wrong with any timezones
	if lastUpdateTime == nil {
		timestampZero := "1970-01-01 12:00:00"
		lastUpdateTime = &timestampZero
	}

	lastUpdateTimeParsed, err := time.Parse("2006-01-02 15:04:05", *lastUpdateTime)
	if err != nil {
		return fmt.Errorf("failed to parse last update time: %w", err)
	}

	if r.lastRefreshTime.Before(lastUpdateTimeParsed) {
		logrus.Debugf("%s: refreshing cache, previous last refresh time %v", r.String(), r.lastRefreshTime)
		if refreshErr := r.refresh(); refreshErr != nil {
			return fmt.Errorf("failed to refresh the %s cache: %w", r.name, refreshErr)
		}
		r.lastRefreshTime = lastUpdateTimeParsed
	}
	return nil
}

func (r *task) String() string {
	return fmt.Sprintf("%s refresh", r.name)
}
