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

package ui

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"testing/fstest"

	"github.com/labstack/echo/v5"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/migrate"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/spec/go/module"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRegisterRouteContentSecurityPolicy(t *testing.T) {
	// Override the package-level embedded filesystem with test data.
	originalAsts := asts
	t.Cleanup(func() { asts = originalAsts })

	testFS := fstest.MapFS{
		"app/dist/index.html":       &fstest.MapFile{Data: []byte("<html><head></head><body></body></html>")},
		"app/dist/main.abc12345.js": &fstest.MapFile{Data: []byte("console.log('ok')")},
		"app/dist/loader-theme.js":  &fstest.MapFile{Data: []byte("console.log('ok')")},
	}
	asts = http.FS(testFS)

	const customPolicy = "script-src 'self'"
	defaultPolicy := config.ContentSecurityPolicy{Policy: config.DefaultContentSecurityPolicy}

	tests := []struct {
		name           string
		apiPrefix      string
		csp            config.ContentSecurityPolicy
		path           string
		expectedPolicy string
	}{
		{
			name:           "root page",
			csp:            defaultPolicy,
			path:           "/",
			expectedPolicy: config.DefaultContentSecurityPolicy,
		},
		{
			name:           "page of a React route",
			csp:            defaultPolicy,
			path:           "/projects/demo",
			expectedPolicy: config.DefaultContentSecurityPolicy,
		},
		{
			name:           "index.html requested as a static file",
			csp:            defaultPolicy,
			path:           "/index.html",
			expectedPolicy: config.DefaultContentSecurityPolicy,
		},
		{
			name:           "the policy only applies to documents: JS bundle",
			csp:            defaultPolicy,
			path:           "/main.abc12345.js",
			expectedPolicy: "",
		},
		{
			name:           "the policy only applies to documents: script of the loading screen",
			csp:            defaultPolicy,
			path:           "/loader-theme.js",
			expectedPolicy: "",
		},
		{
			name:           "custom policy",
			csp:            config.ContentSecurityPolicy{Policy: customPolicy},
			path:           "/projects/demo",
			expectedPolicy: customPolicy,
		},
		{
			name:           "no policy when it's disabled",
			csp:            config.ContentSecurityPolicy{Disable: true, Policy: config.DefaultContentSecurityPolicy},
			path:           "/projects/demo",
			expectedPolicy: "",
		},
		{
			name:           "root page with an API prefix",
			apiPrefix:      "/perses",
			csp:            defaultPolicy,
			path:           "/perses",
			expectedPolicy: config.DefaultContentSecurityPolicy,
		},
		{
			name:           "page of a React route with an API prefix",
			apiPrefix:      "/perses",
			csp:            defaultPolicy,
			path:           "/perses/projects/demo",
			expectedPolicy: config.DefaultContentSecurityPolicy,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := config.Config{
				APIPrefix: tt.apiPrefix,
				Security:  config.Security{ContentSecurityPolicy: tt.csp},
			}
			e := echo.New()
			NewPersesFrontend(cfg, nil).RegisterRoute(e)
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			e.ServeHTTP(rec, req)

			require.Equal(t, http.StatusOK, rec.Code)
			assert.Equal(t, tt.expectedPolicy, rec.Header().Get("Content-Security-Policy"))
		})
	}
}

// A browser keeps the Content-Security-Policy of the page it cached when the revalidation of the page is answered with a
// 304 that doesn't have the header: changing or disabling the policy must change the ETag of the pages.
func TestRegisterRouteContentSecurityPolicyRevalidation(t *testing.T) {
	// Override the package-level embedded filesystem with test data.
	originalAsts := asts
	t.Cleanup(func() { asts = originalAsts })

	testFS := fstest.MapFS{
		"app/dist/index.html": &fstest.MapFile{Data: []byte("<html><head></head><body></body></html>")},
	}
	asts = http.FS(testFS)

	enabled := config.ContentSecurityPolicy{Policy: config.DefaultContentSecurityPolicy}
	disabled := config.ContentSecurityPolicy{Disable: true, Policy: config.DefaultContentSecurityPolicy}
	custom := config.ContentSecurityPolicy{Policy: "script-src 'self'"}

	// requestPage requests a page of the UI to a server configured with the given policy.
	requestPage := func(t *testing.T, csp config.ContentSecurityPolicy, ifNoneMatch string) *httptest.ResponseRecorder {
		t.Helper()
		e := echo.New()
		NewPersesFrontend(config.Config{Security: config.Security{ContentSecurityPolicy: csp}}, nil).RegisterRoute(e)
		req := httptest.NewRequest(http.MethodGet, "/projects/demo", nil)
		if len(ifNoneMatch) > 0 {
			req.Header.Set("If-None-Match", ifNoneMatch)
		}
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		return rec
	}

	tests := []struct {
		name           string
		cachedWith     config.ContentSecurityPolicy
		servedWith     config.ContentSecurityPolicy
		expectedStatus int
		expectedPolicy string
	}{
		{
			name:           "same policy",
			cachedWith:     enabled,
			servedWith:     enabled,
			expectedStatus: http.StatusNotModified,
			expectedPolicy: config.DefaultContentSecurityPolicy,
		},
		{
			name:           "policy disabled",
			cachedWith:     enabled,
			servedWith:     disabled,
			expectedStatus: http.StatusOK,
			expectedPolicy: "",
		},
		{
			name:           "policy changed",
			cachedWith:     enabled,
			servedWith:     custom,
			expectedStatus: http.StatusOK,
			expectedPolicy: "script-src 'self'",
		},
		{
			name:           "policy enabled",
			cachedWith:     disabled,
			servedWith:     enabled,
			expectedStatus: http.StatusOK,
			expectedPolicy: config.DefaultContentSecurityPolicy,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cached := requestPage(t, tt.cachedWith, "")
			require.Equal(t, http.StatusOK, cached.Code)
			etag := cached.Header().Get("ETag")
			require.NotEmpty(t, etag)

			rec := requestPage(t, tt.servedWith, etag)

			assert.Equal(t, tt.expectedStatus, rec.Code)
			assert.Equal(t, tt.expectedPolicy, rec.Header().Get("Content-Security-Policy"))
		})
	}
}

func TestAssetHandlerContentType(t *testing.T) {
	// Override the package-level embedded filesystem with test data.
	originalAsts := asts
	t.Cleanup(func() { asts = originalAsts })

	testFS := fstest.MapFS{
		"app/dist/main.abc12345.css": &fstest.MapFile{Data: []byte("body { background: url(PREFIX_PATH_PLACEHOLDER/font.woff2); }")},
		"app/dist/main.abc12345.js":  &fstest.MapFile{Data: []byte("console.log('PREFIX_PATH_PLACEHOLDER')")},
		"app/dist/image.png":         &fstest.MapFile{Data: []byte("fake-png-data")},
		"app/dist/index.html":        &fstest.MapFile{Data: []byte("<html></html>")},
	}
	asts = http.FS(testFS)

	f := &frontend{apiPrefix: "/custom"}

	tests := []struct {
		name                 string
		path                 string
		expectedContentTypes []string
		expectedBody         string
	}{
		{
			name:                 "CSS file with placeholder substitution",
			path:                 "/app/dist/main.abc12345.css",
			expectedContentTypes: []string{"text/css; charset=utf-8"},
			expectedBody:         "body { background: url(/custom/font.woff2); }",
		},
		{
			name: "JavaScript file with placeholder substitution",
			path: "/app/dist/main.abc12345.js",
			// Windows registers the obsolete application/javascript MIME type.
			expectedContentTypes: []string{"text/javascript; charset=utf-8", "application/javascript"},
			expectedBody:         "console.log('/custom')",
		},
		{
			name:                 "HTML file",
			path:                 "/app/dist/index.html",
			expectedContentTypes: []string{"text/html; charset=utf-8"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()
			ctx := e.NewContext(req, rec)

			handler := f.assetHandler()
			err := handler(ctx)
			require.NoError(t, err)
			assert.Contains(t, tt.expectedContentTypes, rec.Header().Get("Content-Type"))
			assert.Equal(t, "nosniff", rec.Header().Get("X-Content-Type-Options"))
			if tt.expectedBody != "" {
				assert.Equal(t, tt.expectedBody, rec.Body.String())
				assert.NotContains(t, rec.Body.String(), prefixPathPlaceholder)
			}
		})
	}
}

func TestAssetHandlerCacheControl(t *testing.T) {
	// Override the package-level embedded filesystem with test data.
	originalAsts := asts
	t.Cleanup(func() { asts = originalAsts })

	testFS := fstest.MapFS{
		"app/dist/main.abc12345.css": &fstest.MapFile{Data: []byte("body {}")},
		"app/dist/main.abc12345.js":  &fstest.MapFile{Data: []byte("console.log('ok')")},
		"app/dist/image.png":         &fstest.MapFile{Data: []byte("fake-png-data")},
	}
	asts = http.FS(testFS)

	f := &frontend{apiPrefix: ""}

	tests := []struct {
		name                 string
		path                 string
		expectedCacheControl string
	}{
		{
			name:                 "hashed CSS bundle is cached long term",
			path:                 "/app/dist/main.abc12345.css",
			expectedCacheControl: "public, max-age=31536000, immutable",
		},
		{
			name:                 "hashed JS bundle is cached long term",
			path:                 "/app/dist/main.abc12345.js",
			expectedCacheControl: "public, max-age=31536000, immutable",
		},
		{
			name:                 "other assets must be revalidated",
			path:                 "/app/dist/image.png",
			expectedCacheControl: "no-cache",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()
			ctx := e.NewContext(req, rec)

			handler := f.assetHandler()
			err := handler(ctx)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedCacheControl, rec.Header().Get("Cache-Control"))
			assert.NotEmpty(t, rec.Header().Get("ETag"))
		})
	}
}

func TestAssetHandlerConditionalRequest(t *testing.T) {
	// Override the package-level embedded filesystem with test data.
	originalAsts := asts
	t.Cleanup(func() { asts = originalAsts })

	testFS := fstest.MapFS{
		"app/dist/main.abc12345.js": &fstest.MapFile{Data: []byte("console.log('PREFIX_PATH_PLACEHOLDER')")},
	}
	asts = http.FS(testFS)

	f := &frontend{apiPrefix: "/custom"}
	e := echo.New()

	// First request: full response with an ETag.
	req := httptest.NewRequest(http.MethodGet, "/app/dist/main.abc12345.js", nil)
	rec := httptest.NewRecorder()
	require.NoError(t, f.assetHandler()(e.NewContext(req, rec)))
	require.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "console.log('/custom')", rec.Body.String())
	etag := rec.Header().Get("ETag")
	require.NotEmpty(t, etag)

	// Second request with If-None-Match: the server must answer 304 without a body.
	req = httptest.NewRequest(http.MethodGet, "/app/dist/main.abc12345.js", nil)
	req.Header.Set("If-None-Match", etag)
	rec = httptest.NewRecorder()
	require.NoError(t, f.assetHandler()(e.NewContext(req, rec)))
	assert.Equal(t, http.StatusNotModified, rec.Code)
	assert.Empty(t, rec.Body.String())

	// The ETag depends on the bytes actually sent, so a different prefix yields a different ETag.
	other := &frontend{apiPrefix: "/other"}
	req = httptest.NewRequest(http.MethodGet, "/app/dist/main.abc12345.js", nil)
	rec = httptest.NewRecorder()
	require.NoError(t, other.assetHandler()(e.NewContext(req, rec)))
	assert.NotEqual(t, etag, rec.Header().Get("ETag"))
}

func TestIsHashedAsset(t *testing.T) {
	tests := []struct {
		name     string
		expected bool
	}{
		{"/app/dist/main.daecaaf558591aab.js", true},
		{"/app/dist/main.184a811c682450f7.css", true},
		{"__mf/js/main.f55169be.js", true},
		{"__mf/js/async/463.85c2cbf6.css", true},
		{"__mf/js/TimeSeriesChart.b9caac04.js", true},
		{"__mf/font/inter-latin-600-normal.ce0f5f43.woff2", true},
		{"__mf/font/inter-latin-600-normal.8fb1a964.woff", true},
		{"/app/dist/ef6d3f52c547a6e3.woff2", true},
		{"/app/dist/9ae3a3c52a1fab2f.woff", true},
		{"__mf/js/async/392.8cb3dcaa.js.LICENSE.txt", false},
		{"mf-manifest.json", false},
		{"/app/dist/index.html", false},
		{"/app/dist/image.png", false},
		{"/app/dist/favicon.ico", false},
		{"/app/dist/cafe.woff2", false},
		{"/app/dist/main.js", false},
		{"/app/dist/vendor.min.js", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, isHashedAsset(tt.name))
		})
	}
}

func TestServeASTFilesContentType(t *testing.T) {
	// Override the package-level embedded filesystem with test data.
	originalAsts := asts
	t.Cleanup(func() { asts = originalAsts })

	testFS := fstest.MapFS{
		"app/dist/index.html": &fstest.MapFile{Data: []byte("<html><head></head><body></body></html>")},
	}
	asts = http.FS(testFS)

	f := &frontend{apiPrefix: ""}

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	err := f.serveASTFiles(ctx)
	require.NoError(t, err)
	assert.Equal(t, "text/html; charset=utf-8", rec.Header().Get("Content-Type"))
	assert.Equal(t, "nosniff", rec.Header().Get("X-Content-Type-Options"))
	assert.Equal(t, "no-cache", rec.Header().Get("Cache-Control"))
	assert.NotEmpty(t, rec.Header().Get("ETag"))
}

func TestParsePluginPath(t *testing.T) {
	tests := []struct {
		name             string
		input            string
		expectedName     string
		expectedVersion  string
		expectedRegistry string
		expectedRelPath  string
		expectedOk       bool
	}{
		{
			name:             "Simple name",
			input:            "/plugins/plugin",
			expectedName:     "plugin",
			expectedVersion:  "latest",
			expectedRegistry: "perses.dev",
			expectedRelPath:  "",
			expectedOk:       true,
		},
		{
			name:             "Invalid path",
			input:            "invalid",
			expectedName:     "",
			expectedVersion:  "",
			expectedRegistry: "",
			expectedRelPath:  "",
			expectedOk:       false,
		},
		{
			name:             "Complex name",
			input:            "/plugins/plugin-name-with-908.0.1",
			expectedName:     "plugin-name-with-908.0.1",
			expectedVersion:  "latest",
			expectedRegistry: "perses.dev",
			expectedRelPath:  "",
			expectedOk:       true,
		},
		{
			name:             "Plugin with version",
			input:            "/plugins/plugin~1.2.3",
			expectedName:     "plugin",
			expectedVersion:  "1.2.3",
			expectedRegistry: "perses.dev",
			expectedRelPath:  "",
			expectedOk:       true,
		},
		{
			name:             "Plugin with version and registry",
			input:            "/plugins/plugin~1.2.3~my-registry",
			expectedName:     "plugin",
			expectedVersion:  "1.2.3",
			expectedRegistry: "my-registry",
			expectedRelPath:  "",
			expectedOk:       true,
		},
		{
			name:             "Plugin with version, registry and file",
			input:            "/plugins/plugin~1.2.3~my-registry/manifest.json",
			expectedName:     "plugin",
			expectedVersion:  "1.2.3",
			expectedRegistry: "my-registry",
			expectedRelPath:  "manifest.json",
			expectedOk:       true,
		},
		{
			name:             "Plugin with version and registry",
			input:            "/plugins/plugin~~my-registry/manifest.json",
			expectedName:     "plugin",
			expectedVersion:  "latest",
			expectedRegistry: "my-registry",
			expectedRelPath:  "manifest.json",
			expectedOk:       true,
		},
		{
			name:             "Plugin with version and perses.dev registry",
			input:            "/plugins/plugin~2.0.0~perses.dev/manifest.json",
			expectedName:     "plugin",
			expectedVersion:  "2.0.0",
			expectedRegistry: "perses.dev",
			expectedRelPath:  "manifest.json",
			expectedOk:       true,
		},
		{
			name:             "Traling slashes in registry",
			input:            "/plugins/plugin~1.2.3~my-registry///manifest.json",
			expectedName:     "plugin",
			expectedVersion:  "1.2.3",
			expectedRegistry: "my-registry",
			expectedRelPath:  "manifest.json",
			expectedOk:       true,
		},
		{
			name:             "Traling slash without file",
			input:            "/plugins/plugin~1.2.3~my-registry///",
			expectedName:     "plugin",
			expectedVersion:  "1.2.3",
			expectedRegistry: "my-registry",
			expectedRelPath:  "",
			expectedOk:       true,
		},
		{
			name:             "Backwards compatible",
			input:            "/plugins/plugin/manifest.json",
			expectedName:     "plugin",
			expectedVersion:  "latest",
			expectedRegistry: "perses.dev",
			expectedRelPath:  "manifest.json",
			expectedOk:       true,
		},
		{
			name:             "Nested file path",
			input:            "/plugins/plugin/static/js/app.js",
			expectedName:     "plugin",
			expectedVersion:  "latest",
			expectedRegistry: "perses.dev",
			expectedRelPath:  "static/js/app.js",
			expectedOk:       true,
		},
		{
			name:       "Path traversal escaping plugins prefix",
			input:      "/plugins/plugin/../../../etc/passwd",
			expectedOk: false,
		},
		{
			name:       "Path traversal to sibling directory",
			input:      "/plugins/plugin/../../other/secret",
			expectedOk: false,
		},
		{
			name:             "Path traversal staying within plugin",
			input:            "/plugins/plugin/subdir/../file.js",
			expectedName:     "plugin",
			expectedVersion:  "latest",
			expectedRegistry: "perses.dev",
			expectedRelPath:  "file.js",
			expectedOk:       true,
		},
		{
			name:             "Trailing slash without file",
			input:            "/plugins/plugin/",
			expectedName:     "plugin",
			expectedVersion:  "latest",
			expectedRegistry: "perses.dev",
			expectedRelPath:  "",
			expectedOk:       true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			name, version, registry, relPath, ok := parsePluginPath(tt.input)
			assert.Equal(t, tt.expectedOk, ok)
			assert.Equal(t, tt.expectedName, name)
			assert.Equal(t, tt.expectedVersion, version)
			assert.Equal(t, tt.expectedRegistry, registry)
			assert.Equal(t, tt.expectedRelPath, relPath)
		})
	}
}

type mockPluginService struct {
	loaded map[string]*plugin.Loaded
}

func (m *mockPluginService) Load() error                                    { return nil }
func (m *mockPluginService) LoadDevPlugin(_ []v1.PluginInDevelopment) error { return nil }
func (m *mockPluginService) RefreshDevPlugin(_ module.Metadata) error       { return nil }
func (m *mockPluginService) UnLoadDevPlugin(_ module.Metadata) error        { return nil }
func (m *mockPluginService) List() ([]byte, error)                          { return nil, nil }
func (m *mockPluginService) UnzipArchives() error                           { return nil }
func (m *mockPluginService) Schema() schema.Schema                          { return nil }
func (m *mockPluginService) Migration() migrate.Migration                   { return nil }
func (m *mockPluginService) GetLoadedPlugin(name, _, _ string) (*plugin.Loaded, bool) {
	l, ok := m.loaded[name]
	return l, ok
}

func TestServePluginFilesPathTraversal(t *testing.T) {
	pluginDir := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(pluginDir, "manifest.json"), []byte(`{"name":"test"}`), 0o600))
	require.NoError(t, os.MkdirAll(filepath.Join(pluginDir, "static"), 0o750))
	require.NoError(t, os.WriteFile(filepath.Join(pluginDir, "static", "app.js"), []byte("console.log('ok')"), 0o600))

	mockSvc := &mockPluginService{
		loaded: map[string]*plugin.Loaded{
			"testplugin": {
				LocalPath: pluginDir,
				Module: v1.PluginModule{
					Status: &module.Status{IsLoaded: true},
				},
			},
		},
	}

	tests := []struct {
		name      string
		apiPrefix string
		path      string
		wantErr   bool
	}{
		{
			name:      "Legitimate file access",
			apiPrefix: "",
			path:      "/plugins/testplugin/manifest.json",
			wantErr:   false,
		},
		{
			name:      "Legitimate nested file access",
			apiPrefix: "",
			path:      "/plugins/testplugin/static/app.js",
			wantErr:   false,
		},
		{
			name:      "Path traversal escaping plugin dir",
			apiPrefix: "",
			path:      "/plugins/testplugin/../../../etc/passwd",
			wantErr:   true,
		},
		{
			name:      "Path traversal to sibling directory",
			apiPrefix: "",
			path:      "/plugins/testplugin/../secret.txt",
			wantErr:   true,
		},
		{
			name:      "Non-existent plugin",
			apiPrefix: "",
			path:      "/plugins/nonexistent/file.js",
			wantErr:   true,
		},
		{
			name:      "Plugin root without file returns error",
			apiPrefix: "",
			path:      "/plugins/testplugin",
			wantErr:   true,
		},
		{
			name:      "apiPrefix stripped correctly",
			apiPrefix: "/api",
			path:      "/api/plugins/testplugin/manifest.json",
			wantErr:   false,
		},
		{
			name:      "apiPrefix with nested prefix",
			apiPrefix: "/app/v1",
			path:      "/app/v1/plugins/testplugin/static/app.js",
			wantErr:   false,
		},
		{
			name:      "apiPrefix with traversal attempt",
			apiPrefix: "/api",
			path:      "/api/plugins/testplugin/../../../etc/passwd",
			wantErr:   true,
		},
		{
			name:      "apiPrefix mismatch returns error",
			apiPrefix: "/api",
			path:      "/wrong/plugins/testplugin/manifest.json",
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := &frontend{
				apiPrefix:     tt.apiPrefix,
				pluginService: mockSvc,
			}
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()
			ctx := e.NewContext(req, rec)

			err := f.servePluginFiles(ctx)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestServePluginFilesCacheControl(t *testing.T) {
	// The plugin directory is an absolute path outside the working directory, like /etc/perses/plugins in the container image.
	pluginDir := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(pluginDir, "mf-manifest.json"), []byte(`{"name":"test"}`), 0o600))
	require.NoError(t, os.MkdirAll(filepath.Join(pluginDir, "__mf", "js"), 0o750))
	require.NoError(t, os.WriteFile(filepath.Join(pluginDir, "__mf", "js", "main.f55169be.js"), []byte("console.log('ok')"), 0o600))

	mockSvc := &mockPluginService{
		loaded: map[string]*plugin.Loaded{
			"testplugin": {
				LocalPath: pluginDir,
				Module: v1.PluginModule{
					Status: &module.Status{IsLoaded: true},
				},
			},
		},
	}
	f := &frontend{pluginService: mockSvc}

	tests := []struct {
		name                 string
		path                 string
		expectedCacheControl string
		expectedBody         string
	}{
		{
			name:                 "manifest must be revalidated",
			path:                 "/plugins/testplugin/mf-manifest.json",
			expectedCacheControl: "no-cache",
			expectedBody:         `{"name":"test"}`,
		},
		{
			name:                 "hashed bundle is cached long term",
			path:                 "/plugins/testplugin/__mf/js/main.f55169be.js",
			expectedCacheControl: "public, max-age=31536000, immutable",
			expectedBody:         "console.log('ok')",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()
			require.NoError(t, f.servePluginFiles(e.NewContext(req, rec)))
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.Equal(t, tt.expectedBody, rec.Body.String())
			assert.Equal(t, tt.expectedCacheControl, rec.Header().Get("Cache-Control"))
			assert.Equal(t, "nosniff", rec.Header().Get("X-Content-Type-Options"))
			assert.NotEmpty(t, rec.Header().Get("Last-Modified"))
		})
	}
}
