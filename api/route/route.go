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

package route

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

const methodAny = "all"

type Endpoint interface {
	CollectRoutes(g *Group)
}

type Route struct {
	// Method is the HTTP method such as POST, PUT, DELETE, etc.
	Method  string
	Path    string
	Handler echo.HandlerFunc
	// IsAnonymous is telling if the given route should be accessible without a JWT token.
	IsAnonymous bool
	Middlewares []echo.MiddlewareFunc
}

func (r *Route) Register(g *echo.Group, middleware ...echo.MiddlewareFunc) {
	if r.Method == methodAny {
		g.Any(r.Path, r.Handler, middleware...)
	} else {
		g.Add(r.Method, r.Path, r.Handler, middleware...)
	}
}

type Group struct {
	Path        string
	Groups      []*Group
	Routes      []*Route
	Middlewares []echo.MiddlewareFunc
}

func (g *Group) Group(path string, middleware ...echo.MiddlewareFunc) *Group {
	newGroup := &Group{
		Path:        path,
		Middlewares: middleware,
	}
	g.Groups = append(g.Groups, newGroup)
	return newGroup
}

func (g *Group) ANY(path string, h echo.HandlerFunc, isAnonymous bool, middleware ...echo.MiddlewareFunc) {
	g.Routes = append(g.Routes, &Route{
		Method:      methodAny,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
		Middlewares: middleware,
	})
}

func (g *Group) POST(path string, h echo.HandlerFunc, isAnonymous bool, middleware ...echo.MiddlewareFunc) {
	g.Routes = append(g.Routes, &Route{
		Method:      http.MethodPost,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
		Middlewares: middleware,
	})
}

func (g *Group) PUT(path string, h echo.HandlerFunc, isAnonymous bool, middleware ...echo.MiddlewareFunc) {
	g.Routes = append(g.Routes, &Route{
		Method:      http.MethodPut,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
		Middlewares: middleware,
	})
}

func (g *Group) GET(path string, h echo.HandlerFunc, isAnonymous bool, middleware ...echo.MiddlewareFunc) {
	g.Routes = append(g.Routes, &Route{
		Method:      http.MethodGet,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
		Middlewares: middleware,
	})
}

func (g *Group) DELETE(path string, h echo.HandlerFunc, isAnonymous bool, middleware ...echo.MiddlewareFunc) {
	g.Routes = append(g.Routes, &Route{
		Method:      http.MethodDelete,
		Path:        path,
		Handler:     h,
		IsAnonymous: isAnonymous,
		Middlewares: middleware,
	})
}
