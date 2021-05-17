package dashboard_feed

import v1 "github.com/perses/perses/pkg/model/api/v1"

type Service interface {
	FeedSection(request *v1.SectionFeedRequest) ([]v1.SectionFeedResponse, error)
	FeedVariable(request *v1.VariableFeedRequest) ([]v1.VariableFeedResponse, error)
}
