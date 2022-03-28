package version

import (
	"testing"

	cmdUtilsTest "github.com/perses/perses/internal/cli/utils/test"
	"github.com/perses/perses/pkg/client/fake_api"
	"github.com/prometheus/common/version"
)

func TestVersionCMD(t *testing.T) {
	version.Version = "v0.2.0"
	version.BuildDate = "2022-03-24"
	version.Revision = "5567c3dc05e122d309b0d78aea3d418bd9aaf968"
	testSuite := []cmdUtilsTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: false,
			ExpectedMessage: `client:
  buildTime: "2022-03-24"
  version: v0.2.0
  commit: 5567c3dc05e122d309b0d78aea3d418bd9aaf968

`,
		},
		{
			Title:           "print version in json",
			Args:            []string{"--output", "json"},
			IsErrorExpected: false,
			ExpectedMessage: `{"client":{"buildTime":"2022-03-24","version":"v0.2.0","commit":"5567c3dc05e122d309b0d78aea3d418bd9aaf968"}}
`,
		},
		{
			Title:           "print short version",
			Args:            []string{"--short"},
			IsErrorExpected: false,
			ExpectedMessage: `client:
  version: v0.2.0

`,
		},
		{
			Title:           "print client and server version",
			Args:            []string{},
			APIClient:       fake_api.New(),
			IsErrorExpected: false,
			ExpectedMessage: `client:
  buildTime: "2022-03-24"
  version: v0.2.0
  commit: 5567c3dc05e122d309b0d78aea3d418bd9aaf968
server:
  buildTime: "2022-03-23"
  version: v0.1.0
  commit: ff30323938a15cfa9df3071bb84e3f3ef75153df

`,
		},
	}
	cmdUtilsTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}
