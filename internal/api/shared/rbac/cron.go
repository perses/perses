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
	"time"

	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/config"
	"github.com/perses/perses/internal/api/shared/database/model"
	"github.com/sirupsen/logrus"
)

func NewCronTask(rbacService RBAC, dbConf config.Database, persesDAO model.DAO) async.SimpleTask {
	return &rbacTask{svc: rbacService, dbConf: dbConf, persesDAO: persesDAO}
}

type rbacTask struct {
	async.SimpleTask
	svc       RBAC
	dbConf    config.Database
	persesDAO model.DAO
}

// Execute checks every X seconds: if role, globalrole, rolebinding or globalrolebinding tables have been updated
// If yes, refresh rbac cache
// TODO: support diff database timezone
func (r *rbacTask) Execute(_ context.Context, _ context.CancelFunc) error {
	if r.dbConf.SQL != nil {
		lastUpdateTime, err := r.persesDAO.CheckTablesLatestUpdateTime([]string{"role", "rolebinding", "globalrole", "globalrolebinding"})
		if err != nil {
			return err
		}

		// TODO: check
		if lastUpdateTime == nil {
			return nil
		}

		lastRefreshTime, err := time.Parse("2006-01-02 15:04:05", *lastUpdateTime)
		if err != nil {
			return err
		}

		if r.svc.LastRefreshTime().Before(lastRefreshTime) {
			logrus.Debugf("refreshing rbac cache, previous last refresh time %v", r.svc.LastRefreshTime())
			if err := r.svc.Refresh(); err != nil {
				return err
			}
		}
	}
	return nil
}

func (r *rbacTask) String() string {
	return "rbac refresh cache"
}
