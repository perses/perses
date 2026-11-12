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

package middleware

import (
	"regexp"
	"strings"

	"github.com/labstack/echo/v5"
	echoMiddleware "github.com/labstack/echo/v5/middleware"
	"github.com/perses/perses/pkg/model/api/config"
)

// maxOriginLength is the maximum length of an origin matched against the wildcard patterns, like echo v4:
// a domain name (253 characters at most), "://" and the scheme "https". It avoids the cost of the regexps for long values.
const maxOriginLength = 253 + 3 + 5

// CORS returns the middleware handling the CORS requests according to the given configuration.
func CORS(conf config.CORSConfig) echo.MiddlewareFunc {
	allowOrigins := conf.AllowOrigins
	if len(allowOrigins) == 0 {
		// Like the configuration (and echo v4), every origin is allowed by default.
		allowOrigins = []string{"*"}
	}
	return echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		UnsafeAllowOriginFunc: newOriginMatcher(allowOrigins).allowOrigin,
		AllowMethods:          conf.AllowMethods,
		AllowHeaders:          conf.AllowHeaders,
		AllowCredentials:      conf.AllowCredentials,
		ExposeHeaders:         conf.ExposeHeaders,
		MaxAge:                conf.MaxAge,
	})
}

// originMatcher matches the origins of the CORS requests like echo v4 did, as echo v5 doesn't support
// the wildcard patterns anymore (and matches the exact origins without considering the case).
// TODO: remove it with the deprecated wildcard patterns in v0.58.0 and use the AllowOrigins of the echo middleware instead.
// See https://github.com/perses/perses/issues/4721.
type originMatcher struct {
	allowOrigins []string
	patterns     []*regexp.Regexp
}

func newOriginMatcher(allowOrigins []string) *originMatcher {
	m := &originMatcher{allowOrigins: allowOrigins}
	for _, origin := range allowOrigins {
		if origin == "*" {
			continue
		}
		pattern := regexp.QuoteMeta(origin)
		pattern = strings.ReplaceAll(pattern, `\*`, ".*")
		pattern = strings.ReplaceAll(pattern, `\?`, ".")
		re, err := regexp.Compile("^" + pattern + "$")
		if err != nil {
			// Like echo v4, an invalid pattern never matches.
			continue
		}
		m.patterns = append(m.patterns, re)
	}
	return m
}

// allowOrigin returns the value of the header Access-Control-Allow-Origin for the given origin, and if it is allowed.
func (m *originMatcher) allowOrigin(_ *echo.Context, origin string) (string, bool, error) {
	for _, allowOrigin := range m.allowOrigins {
		if allowOrigin == "*" || allowOrigin == origin {
			return allowOrigin, true, nil
		}
		if matchSubdomain(origin, allowOrigin) {
			return origin, true, nil
		}
	}
	if len(origin) > maxOriginLength || !strings.Contains(origin, "://") {
		return "", false, nil
	}
	for _, pattern := range m.patterns {
		if pattern.MatchString(origin) {
			return origin, true, nil
		}
	}
	return "", false, nil
}

// matchSubdomain tells if the origin matches the pattern label by label, starting from the top-level domain.
// The label "*" of the pattern matches all the remaining labels of the origin (e.g. https://*.example.com).
// The schemes must be equal.
func matchSubdomain(origin, pattern string) bool {
	originScheme, originHost, ok := strings.Cut(origin, "://")
	if !ok {
		return false
	}
	patternScheme, patternHost, ok := strings.Cut(pattern, "://")
	if !ok || originScheme != patternScheme || len(originHost) > 253 {
		return false
	}
	originLabels := strings.Split(originHost, ".")
	patternLabels := strings.Split(patternHost, ".")
	for i := range originLabels {
		if i >= len(patternLabels) {
			return false
		}
		patternLabel := patternLabels[len(patternLabels)-1-i]
		if patternLabel == "*" {
			return true
		}
		if patternLabel != originLabels[len(originLabels)-1-i] {
			return false
		}
	}
	return false
}
