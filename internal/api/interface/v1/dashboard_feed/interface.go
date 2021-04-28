package dashboard_feed

import v1 "github.com/perses/perses/pkg/model/api/v1"

type Service interface {
	FeedSection(sectionRequest *v1.SectionFeedRequest) ([]v1.SectionFeedResponse, error)
}
