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

package service

import (
	databaseModel "github.com/perses/perses/api/database/model"
	apiInterface "github.com/perses/perses/api/interface"
	"github.com/perses/perses/api/interface/v1/globaldatasource"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

func New(caseSensitive bool, svc globaldatasource.Service) *ApplyService {
	return &ApplyService{
		caseSensitive: caseSensitive,
		svc:           svc,
	}
}

type ApplyService struct {
	caseSensitive bool
	svc           globaldatasource.Service
}

func (a *ApplyService) Apply(entities []*v1.GlobalDatasource) {
	for _, entity := range entities {
		entity.GetMetadata().Flatten(a.caseSensitive)
		_, createErr := a.svc.Create(apiInterface.EmptyCtx, entity)
		if createErr == nil {
			continue
		}

		if !databaseModel.IsKeyConflict(createErr) {
			logrus.WithError(createErr).Errorf("unable to create the globaldatasource %q", entity.Metadata.Name)
			continue
		}

		param := apiInterface.Parameters{
			Name: entity.Metadata.Name,
		}

		if _, updateError := a.svc.Update(apiInterface.EmptyCtx, entity, param); updateError != nil {
			logrus.WithError(updateError).Errorf("unable to update the globaldatasource %q", entity.Metadata.Name)
		}
	}
}
