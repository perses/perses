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

package dashboard

import (
	"context"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/perses/api/interface/v1/ephemeraldashboard"
	"github.com/sirupsen/logrus"
)

func NewEphemeralDashboardCleaner(dao ephemeraldashboard.DAO) (async.SimpleTask, error) {
	return &Cleaner{
		dao: dao,
	}, nil
}

type Cleaner struct {
	async.Task
	dao ephemeraldashboard.DAO
}

func (c *Cleaner) String() string {
	return "ephemeral dashboards cleaner"
}

func (c *Cleaner) Initialize() error {
	return nil
}

func (c *Cleaner) Execute(_ context.Context, _ context.CancelFunc) error {
	// Get the full list of ephemeral dashboards
	dashboards, err := c.dao.List(&ephemeraldashboard.Query{})
	if err != nil {
		return err
	}

	// Delete any dashboard	for which the TTL has passed
	// /!\ the comparison is done using the updatedAt field, not createdAt
	currentTime := time.Now()
	for _, dashboard := range dashboards {
		if dashboard.Metadata.UpdatedAt.Add(time.Duration(dashboard.Spec.TTL)).Before(currentTime) {
			err := c.dao.Delete(dashboard.Metadata.Project, dashboard.Metadata.Name)
			if err != nil {
				return err
			}
			logrus.Debugf("ephemeral dashboard '%s' has been deleted", dashboard.Metadata.Name)
		}
	}

	return nil
}

func (c *Cleaner) Finalize() error {
	return nil
}
