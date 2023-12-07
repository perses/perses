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
	"github.com/perses/perses/internal/api/shared/database/model"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

func NewCronTask(rbacService RBAC, persesDAO model.DAO) async.SimpleTask {
	return &rbacTask{svc: rbacService, persesDAO: persesDAO}
}

type rbacTask struct {
	async.SimpleTask
	svc             RBAC
	persesDAO       model.DAO
	lastRefreshTime time.Time
}

func (r *rbacTask) Execute(_ context.Context, _ context.CancelFunc) error {
	lastUpdateTime, err := r.persesDAO.GetLatestUpdateTime([]modelV1.Kind{modelV1.KindRole, modelV1.KindRoleBinding, modelV1.KindGlobalRole, modelV1.KindGlobalRoleBinding})
	if err != nil {
		return err
	}

	// If tables have never been updated, using older date than now and that can't be wrong with any timezones
	if lastUpdateTime == nil {
		timestampZero := "1970-01-01 12:00:00"
		lastUpdateTime = &timestampZero
	}

	lastUpdateTimeParsed, err := time.Parse("2006-01-02 15:04:05", *lastUpdateTime)
	if err != nil {
		logrus.WithError(err).Error("failed to parse last update time")
	}

	if r.lastRefreshTime.Before(lastUpdateTimeParsed) {
		logrus.Debugf("refreshing rbac cache, previous last refresh time %v", r.lastRefreshTime)
		if err := r.svc.Refresh(); err != nil {
			logrus.WithError(err).Error("failed to refresh cache")
		} else {
			r.lastRefreshTime = lastUpdateTimeParsed
		}
	}
	return nil
}

func (r *rbacTask) String() string {
	return "rbac refresh cache"
}
