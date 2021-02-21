package project

import (
	"fmt"

	"github.com/perses/perses/internal/api/interface/v1/project"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type service struct {
	project.Service
	dao project.DAO
}

func NewService(dao project.DAO) project.Service {
	return &service{
		dao: dao,
	}
}

func (s *service) Create(entity interface{}) (interface{}, error) {
	if projectObject, ok := entity.(*v1.Project); ok {
		return s.create(projectObject)
	}
	return nil, fmt.Errorf("wrong entity format, attempting project format, received '%T'", entity)
}

func (s *service) create(entity *v1.Project) (*v1.Project, error) {
	return nil, nil
}
