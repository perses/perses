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

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/migrate"
	"github.com/perses/perses/internal/api/plugin/schema"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	pluginModel "github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAssetHandlerContentType(t *testing.T) {
	// Override the package-level embedded filesystem with test data.
	originalAsts := asts
	t.Cleanup(func() { asts = originalAsts })

	testFS := fstest.MapFS{
		"app/dist/main.abc123.css": &fstest.MapFile{Data: []byte("body { background: url(PREFIX_PATH_PLACEHOLDER/font.woff2); }")},
		"app/dist/main.abc123.js":  &fstest.MapFile{Data: []byte("console.log('PREFIX_PATH_PLACEHOLDER')")},
		"app/dist/image.png":       &fstest.MapFile{Data: []byte("fake-png-data")},
		"app/dist/index.html":      &fstest.MapFile{Data: []byte("<html></html>")},
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
			path:                 "/app/dist/main.abc123.css",
			expectedContentTypes: []string{"text/css; charset=utf-8"},
			expectedBody:         "body { background: url(/custom/font.woff2); }",
		},
		{
			name: "JavaScript file with placeholder substitution",
			path: "/app/dist/main.abc123.js",
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

func (m *mockPluginService) Load() error                                         { return nil }
func (m *mockPluginService) LoadDevPlugin(_ []v1.PluginInDevelopment) error      { return nil }
func (m *mockPluginService) RefreshDevPlugin(_ pluginModel.ModuleMetadata) error { return nil }
func (m *mockPluginService) UnLoadDevPlugin(_ pluginModel.ModuleMetadata) error  { return nil }
func (m *mockPluginService) List() ([]byte, error)                               { return nil, nil }
func (m *mockPluginService) UnzipArchives() error                                { return nil }
func (m *mockPluginService) Schema() schema.Schema                               { return nil }
func (m *mockPluginService) Migration() migrate.Migration                        { return nil }
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
					Status: &pluginModel.ModuleStatus{IsLoaded: true},
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
