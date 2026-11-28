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

package provisioning

import (
	"fmt"
	"path/filepath"
	"slices"
	"sort"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/dependency"
	apiInterface "github.com/perses/perses/internal/api/interface"
	dashboardInterface "github.com/perses/perses/internal/api/interface/v1/dashboard"
	datasourceInterface "github.com/perses/perses/internal/api/interface/v1/datasource"
	folderInterface "github.com/perses/perses/internal/api/interface/v1/folder"
	globalDatasourceInterface "github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	globalRoleInterface "github.com/perses/perses/internal/api/interface/v1/globalrole"
	globalRoleBindingInterface "github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	globalSecretInterface "github.com/perses/perses/internal/api/interface/v1/globalsecret"
	globalVariableInterface "github.com/perses/perses/internal/api/interface/v1/globalvariable"
	projectInterface "github.com/perses/perses/internal/api/interface/v1/project"
	roleInterface "github.com/perses/perses/internal/api/interface/v1/role"
	roleBindingInterface "github.com/perses/perses/internal/api/interface/v1/rolebinding"
	secretInterface "github.com/perses/perses/internal/api/interface/v1/secret"
	userInterface "github.com/perses/perses/internal/api/interface/v1/user"
	variableInterface "github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/internal/cli/file"
	"github.com/perses/perses/internal/cli/resource"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type insertFunc func() (modelAPI.Entity, error)

// provisioningServiceInterface is the minimal interface used by both the task and the watcher.
type provisioningServiceInterface interface {
	reloadAllEntities(folders []string)
}

type provisioningService struct {
	serviceManager dependency.ServiceManager
	caseSensitive  bool
	enablePrune    bool
}

// reload reads all entities from the given folders and applies them.
func (p *provisioningService) reloadAllEntities(folders []string) {
	var items []file.EntityWithFile
	for _, dir := range folders {
		objects, errors := file.UnmarshalEntitiesFromDirectoryWithFiles(dir)
		for _, err := range errors {
			logrus.WithError(err).Warningf("unable to load entity from folder %q", dir)
		}
		items = append(items, objects...)
	}
	p.applyEntity(items)
	if p.enablePrune {
		p.pruneEntities(folders, items)
	}
}

func (p *provisioningService) applyEntity(items []file.EntityWithFile) {
	// Provisioning files have no guaranteed order, yet a project-scoped resource
	// can only be created once its parent project exists. So we apply every
	// Project first, ensuring projects declared in the same provisioning batch
	// are created before the resources that belong to them. This keeps the
	// "refuse resources in a non-existing project" guard from rejecting valid
	// resources whose project simply happens to be listed later.
	sort.SliceStable(items, func(i, j int) bool {
		return modelV1.Kind(items[i].Entity.GetKind()) == modelV1.KindProject &&
			modelV1.Kind(items[j].Entity.GetKind()) != modelV1.KindProject
	})
	for _, item := range items {
		entity := item.Entity
		entity.GetMetadata().Flatten(p.caseSensitive)

		// Stamp the provisioning source so the DB can later filter/prune by folder.
		if s, ok := entity.(modelV1.Sourceable); ok {
			s.SetSource(&modelV1.Source{
				Provisioning: &modelV1.ProvisioningSource{
					Folder:   filepath.Dir(item.FilePath),
					FileName: filepath.Base(item.FilePath),
				},
			})
		}

		kind := modelV1.Kind(entity.GetKind())
		name := entity.GetMetadata().GetName()
		project := resource.GetProject(entity.GetMetadata(), "")
		// A project-scoped resource cannot be provisioned if its parent project doesn't exist:
		// the resource would be silently persisted but never visible until the project is created.
		// So we refuse to provision it and report the missing project.
		if len(project) > 0 && !p.projectExists(project) {
			logrus.Errorf("unable to provision the %q/%q: project %q doesn't exist", kind, name, project)
			continue
		}
		param := apiInterface.Parameters{
			Name:    name,
			Project: project,
		}
		createFun, updateFunc, svcErr := p.getService(entity, param)
		if svcErr != nil {
			logrus.WithError(svcErr).Warningf("unable to retrieve the service associated to %q", kind)
			continue
		}

		// the document doesn't exist, so we have to create it.
		_, createErr := createFun()

		if createErr == nil {
			continue
		}

		if !databaseModel.IsKeyConflict(createErr) {
			logrus.WithError(createErr).Errorf("unable to create the %q %q", kind, name)
			continue
		}

		if _, updateError := updateFunc(); updateError != nil {
			logrus.WithError(updateError).Errorf("unable to update the %q %q", kind, name)
		}
	}
}

// entityKey uniquely identifies a provisioned resource across all kinds.
type entityKey struct {
	kind    string
	project string
	name    string
}

// pruneEntities removes resources from the DB that were previously provisioned
// from one of the given folders but whose source file no longer exists.
func (p *provisioningService) pruneEntities(folders []string, live []file.EntityWithFile) {
	for _, folder := range folders {
		// Build the set of live keys scoped per folder.
		var folderKeys []entityKey
		for _, item := range live {
			if filepath.Dir(item.FilePath) != folder {
				continue
			}
			meta := item.Entity.GetMetadata()
			folderKeys = append(folderKeys, entityKey{
				kind:    item.Entity.GetKind(),
				project: resource.GetProject(meta, ""),
				name:    meta.GetName(),
			})
		}
		p.pruneFolder(folder, folderKeys)
	}
}

// pruneFolder deletes all DB resources whose source folder matches dir but
// whose key is absent from the liveKeys slice.
func (p *provisioningService) pruneFolder(dir string, liveKeys []entityKey) {
	p.pruneKind(dir, string(modelV1.KindDashboard), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetDashboard().List(&dashboardInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(project, name string) error {
		return p.serviceManager.GetDashboard().Delete(nil, apiInterface.Parameters{Project: project, Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindDatasource), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetDatasource().List(&datasourceInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(project, name string) error {
		return p.serviceManager.GetDatasource().Delete(nil, apiInterface.Parameters{Project: project, Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindFolder), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetFolder().List(&folderInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(project, name string) error {
		return p.serviceManager.GetFolder().Delete(nil, apiInterface.Parameters{Project: project, Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindGlobalDatasource), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetGlobalDatasource().List(&globalDatasourceInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(_, name string) error {
		return p.serviceManager.GetGlobalDatasource().Delete(nil, apiInterface.Parameters{Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindGlobalRole), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetGlobalRole().List(&globalRoleInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(_, name string) error {
		return p.serviceManager.GetGlobalRole().Delete(nil, apiInterface.Parameters{Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindGlobalRoleBinding), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetGlobalRoleBinding().List(&globalRoleBindingInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(_, name string) error {
		return p.serviceManager.GetGlobalRoleBinding().Delete(nil, apiInterface.Parameters{Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindGlobalSecret), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetGlobalSecret().List(&globalSecretInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(_, name string) error {
		return p.serviceManager.GetGlobalSecret().Delete(nil, apiInterface.Parameters{Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindGlobalVariable), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetGlobalVariable().List(&globalVariableInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(_, name string) error {
		return p.serviceManager.GetGlobalVariable().Delete(nil, apiInterface.Parameters{Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindProject), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetProject().List(&projectInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(_, name string) error {
		return p.serviceManager.GetProject().Delete(nil, apiInterface.Parameters{Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindRole), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetRole().List(&roleInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(project, name string) error {
		return p.serviceManager.GetRole().Delete(nil, apiInterface.Parameters{Project: project, Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindRoleBinding), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetRoleBinding().List(&roleBindingInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(project, name string) error {
		return p.serviceManager.GetRoleBinding().Delete(nil, apiInterface.Parameters{Project: project, Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindSecret), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetSecret().List(&secretInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(project, name string) error {
		return p.serviceManager.GetSecret().Delete(nil, apiInterface.Parameters{Project: project, Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindUser), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetUser().List(&userInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(_, name string) error {
		return p.serviceManager.GetUser().Delete(nil, apiInterface.Parameters{Name: name})
	})
	p.pruneKind(dir, string(modelV1.KindVariable), liveKeys, func(folder string) ([]modelAPI.Entity, error) {
		list, err := p.serviceManager.GetVariable().List(&variableInterface.Query{SourceFolder: folder})
		return toEntities(list, err)
	}, func(project, name string) error {
		return p.serviceManager.GetVariable().Delete(nil, apiInterface.Parameters{Project: project, Name: name})
	})
}

func (p *provisioningService) pruneKind(
	folder string,
	kind string,
	liveKeys []entityKey,
	listFn func(string) ([]modelAPI.Entity, error),
	delFn func(project, name string) error,
) {
	entities, err := listFn(folder)
	if err != nil {
		logrus.WithError(err).Errorf("unable to list %q resources for pruning in folder %q", kind, folder)
		return
	}
	for _, e := range entities {
		meta := e.GetMetadata()
		key := entityKey{
			kind:    kind,
			project: resource.GetProject(meta, ""),
			name:    meta.GetName(),
		}
		if !slices.Contains(liveKeys, key) {
			if delErr := delFn(key.project, key.name); delErr != nil {
				logrus.WithError(delErr).Errorf("unable to prune %q %q/%q", kind, key.project, key.name)
			} else {
				logrus.Infof("pruned %q %q/%q (source folder %q no longer contains it)", kind, key.project, key.name, folder)
			}
		}
	}
}

// toEntities converts a typed slice + error into []modelAPI.Entity + error.
func toEntities[T modelAPI.Entity](list []T, err error) ([]modelAPI.Entity, error) {
	if err != nil {
		return nil, err
	}
	result := make([]modelAPI.Entity, len(list))
	for i, e := range list {
		result[i] = e
	}
	return result, nil
}

// projectExists returns true if a project with the given name exists in the database.
// In case the lookup fails for any reason other than a missing project, we assume the
// project exists so that a transient database error doesn't silently drop the resource.
func (p *provisioningService) projectExists(name string) bool {
	if _, err := p.serviceManager.GetProject().Get(apiInterface.Parameters{Name: name}); err != nil {
		return !databaseModel.IsKeyNotFound(err)
	}
	return true
}

func (p *provisioningService) getService(object modelAPI.Entity, parameters apiInterface.Parameters) (createFunc insertFunc, updateFunc insertFunc, err error) {
	switch entity := object.(type) {
	case *modelV1.Dashboard:
		svc := p.serviceManager.GetDashboard()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.Datasource:
		svc := p.serviceManager.GetDatasource()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.Folder:
		svc := p.serviceManager.GetFolder()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.GlobalDatasource:
		svc := p.serviceManager.GetGlobalDatasource()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.GlobalRole:
		svc := p.serviceManager.GetGlobalRole()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.GlobalRoleBinding:
		svc := p.serviceManager.GetGlobalRoleBinding()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.GlobalSecret:
		svc := p.serviceManager.GetGlobalSecret()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.GlobalVariable:
		svc := p.serviceManager.GetGlobalVariable()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.Project:
		svc := p.serviceManager.GetProject()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.Role:
		svc := p.serviceManager.GetRole()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.RoleBinding:
		svc := p.serviceManager.GetRoleBinding()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.Secret:
		svc := p.serviceManager.GetSecret()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.User:
		svc := p.serviceManager.GetUser()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	case *modelV1.Variable:
		svc := p.serviceManager.GetVariable()
		return func() (modelAPI.Entity, error) {
				return svc.Create(nil, entity)
			},
			func() (modelAPI.Entity, error) {
				return svc.Update(nil, entity, parameters)
			}, nil
	// We don't support the provisioning of the following resources: EphemeralDashboard
	default:
		return nil, nil, fmt.Errorf("resource %q not supported by the provisioning service", entity.GetKind())
	}
}
