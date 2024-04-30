// Copyright 2021 The Perses Authors
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
	"fmt"

	"github.com/brunoga/deep"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/internal/api/schemas"
	"github.com/perses/perses/internal/api/validate"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	dashboard.Service
	dao           dashboard.DAO
	globalVarDAO  globalvariable.DAO
	projectVarDAO variable.DAO
	sch           schemas.Schemas
}

func NewService(dao dashboard.DAO, globalVarDAO globalvariable.DAO, projectVarDAO variable.DAO, sch schemas.Schemas) dashboard.Service {
	return &service{
		dao:           dao,
		globalVarDAO:  globalVarDAO,
		projectVarDAO: projectVarDAO,
		sch:           sch,
	}
}

func (s *service) Create(_ apiInterface.PersesContext, entity *v1.Dashboard) (*v1.Dashboard, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.create(copyEntity)
}

func (s *service) create(entity *v1.Dashboard) (*v1.Dashboard, error) {
	// verify this new dashboard passes the validation
	if err := s.Validate(entity); err != nil {
		return nil, err
	}

	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity *v1.Dashboard, parameters apiInterface.Parameters) (*v1.Dashboard, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.update(copyEntity, parameters)
}

func (s *service) update(entity *v1.Dashboard, parameters apiInterface.Parameters) (*v1.Dashboard, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in dashboard %q and name from the http request %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
	}
	if len(entity.Metadata.Project) == 0 {
		entity.Metadata.Project = parameters.Project
	} else if entity.Metadata.Project != parameters.Project {
		logrus.Debugf("project in dashboard %q and project from the http request %q don't match", entity.Metadata.Project, parameters.Project)
		return nil, apiInterface.HandleBadRequestError("metadata.project and the project name in the http path request don't match")
	}

	// verify this new dashboard passes the validation
	if err := s.Validate(entity); err != nil {
		return nil, err
	}

	// find the previous version of the dashboard
	oldEntity, err := s.dao.Get(parameters.Project, parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the dashboard %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return entity, nil
}

func (s *service) Delete(_ apiInterface.PersesContext, parameters apiInterface.Parameters) error {
	return s.dao.Delete(parameters.Project, parameters.Name)
}

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (*v1.Dashboard, error) {
	return s.dao.Get(parameters.Project, parameters.Name)
}

func (s *service) List(_ apiInterface.PersesContext, q *dashboard.Query, params apiInterface.Parameters) ([]*v1.Dashboard, error) {
	// Query is copied because it can be modified by the toolbox.go: listWhenPermissionIsActivated(...) and need to `q` need to keep initial value
	query, err := deep.Copy(q)
	if err != nil {
		return nil, fmt.Errorf("unable to copy the query: %w", err)
	}
	return s.list(query, params)
}

func (s *service) list(q *dashboard.Query, params apiInterface.Parameters) ([]*v1.Dashboard, error) {
	if len(q.Project) == 0 {
		q.Project = params.Project
	}
	return s.dao.List(q)
}

func (s *service) Validate(entity *v1.Dashboard) error {
	projectVars, projectVarsErr := s.collectProjectVariables(entity.Metadata.Project)
	if projectVarsErr != nil {
		return apiInterface.HandleError(projectVarsErr)
	}

	globalVars, globalVarsErr := s.collectGlobalVariables()
	if globalVarsErr != nil {
		return apiInterface.HandleError(globalVarsErr)
	}

	if err := validate.DashboardSpecWithVars(entity.Spec, s.sch, projectVars, globalVars); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	return nil
}

func (s *service) collectProjectVariables(project string) ([]*v1.Variable, error) {
	if len(project) == 0 {
		return nil, nil
	}
	return s.projectVarDAO.List(&variable.Query{Project: project})
}

func (s *service) collectGlobalVariables() ([]*v1.GlobalVariable, error) {
	return s.globalVarDAO.List(&globalvariable.Query{})
}
