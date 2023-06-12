import { EChartsDataFormat } from '../model';

export const TOOLTIP_PLUGIN_GRID = {
  left: 20,
  right: 20,
  bottom: 10,
  top: 30,
};

export const TOOLTIP_PLUGIN_CHART_HEIGHT = 300;

export const TOOLTIP_PLUGIN_LABEL_DISTANCE =
  TOOLTIP_PLUGIN_CHART_HEIGHT - 41 - TOOLTIP_PLUGIN_GRID.top - TOOLTIP_PLUGIN_GRID.bottom;

export const tooltipPluginData = {
  timeSeries: [
    {
      type: 'line',
      name: '{prevco_component="prevco_tracing",trace_metric_name="up",error="false",instance="localhost:10710",job="sample-metrics",pod_name="demoenv-001",trace_metrics="custom"}',
      data: [
        3705346, 3705847, 3706921, 3707461, 3708560, 3709112, 3710206, 3710722, 3711673, 3712167, 3713108, 3713554,
        3714542, 3715112, 3716256, 3716828, 3718017, 3718628, 3719775, 3720336, 3721486, 3722109, 3723301, 3723914,
        3725075, 3725675, 3726966, 3727586, 3728727, 3729300, 3730494, 3731080, 3732206, 3732717, 3733819, 3734417,
        3735532, 3736136, 3737264, 3737772, 3738884, 3739474, 3740544, 3741096, 3742136, 3742725, 3743826, 3744383,
        3746155, 3747245, 3749502, 3750545, 3752207, 3752735, 3753769, 3754357,
      ],
      color: 'hsla(-1383402512,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{prevco_component="prevco_tracing",trace_metric_name="up",error="false",instance="localhost:10710",job="sample-metrics",pod_name="demoenv-002",trace_metrics="custom"}',
      data: [
        3705416, 3706366, 3706883, 3707897, 3708406, 3709538, 3710029, 3710972, 3711505, 3712530, 3713066, 3714008,
        3714585, 3715712, 3716254, 3717377, 3717890, 3719064, 3719670, 3720796, 3721391, 3722585, 3723203, 3724353,
        3724994, 3726218, 3726845, 3728042, 3728645, 3729813, 3730432, 3731618, 3732164, 3733260, 3733821, 3734913,
        3735505, 3736738, 3737262, 3738377, 3738928, 3740032, 3740582, 3741707, 3742238, 3743349, 3743899, 3745034,
        3746186, 3748465, 3749602, 3751739, 3752335, 3753418, 3753966, 3755144,
      ],
      color: 'hsla(199727260,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{prevco_component="prevco_tracing",trace_metric_name="up",error="false",instance="localhost:10710",job="sample-metrics",pod_name="demoenv-003",trace_metrics="custom"}',
      data: [
        3703268, 3704288, 3704788, 3705790, 3706276, 3707332, 3707833, 3708765, 3709232, 3710215, 3710683, 3711655,
        3712219, 3713307, 3713911, 3715032, 3715621, 3716769, 3717338, 3718501, 3719072, 3720240, 3720895, 3722065,
        3722620, 3723856, 3724530, 3725713, 3726275, 3727519, 3728068, 3729214, 3729781, 3730874, 3731453, 3732524,
        3733095, 3734205, 3734756, 3735853, 3736402, 3737506, 3738030, 3739087, 3739628, 3740681, 3741260, 3742405,
        3743356, 3745489, 3746597, 3748746, 3749498, 3750577, 3751132, 3752240,
      ],
      color: 'hsla(-1943766212,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{prevco_component="prevco_tracing",trace_metric_name="up",error="true",instance="localhost:10710",job="sample-metrics",pod_name="demoenv-002",trace_metrics="custom"}',
      data: [
        716318, 716420, 716469, 716565, 716619, 716711, 716763, 716854, 716884, 716997, 717039, 717129, 717343, 717787,
        718011, 718501, 718742, 719215, 719453, 719936, 720201, 720730, 721004, 721514, 721793, 722344, 722645, 723130,
        723377, 723872, 724123, 724626, 724856, 725301, 725516, 725988, 726242, 726737, 726983, 727405, 727642, 728144,
        728377, 728846, 729072, 729552, 729771, 730261, 730466, 730926, 731129, 731545, 731772, 732211, 732448, 732873,
      ],
      color: 'hsla(841345616,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{prevco_component="prevco_tracing",trace_metric_name="up",error="true",instance="localhost:10710",job="sample-metrics",pod_name="demoenv-001",trace_metrics="custom"}',
      data: [
        718120, 718170, 718258, 718318, 718409, 718473, 718580, 718623, 718726, 718771, 718871, 718922, 719202, 719470,
        719945, 720185, 720651, 720897, 721397, 721648, 722150, 722390, 722924, 723198, 723720, 723987, 724568, 724824,
        725337, 725617, 726169, 726389, 726869, 727081, 727534, 727736, 728185, 728437, 728915, 729121, 729630, 729858,
        730321, 730548, 730992, 731219, 731688, 731935, 732379, 732591, 732969, 733176, 733634, 733860, 734306, 734534,
      ],
      color: 'hsla(-741784156,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{prevco_component="prevco_tracing",trace_metric_name="up",error="true",instance="localhost:10710",job="sample-metrics",pod_name="demoenv-003",trace_metrics="custom"}',
      data: [
        719075, 719161, 719212, 719300, 719346, 719453, 719502, 719599, 719641, 719732, 719778, 719857, 720047, 720542,
        720789, 721264, 721489, 722030, 722296, 722783, 723056, 723587, 723896, 724426, 724654, 725172, 725462, 725980,
        726226, 726765, 727011, 727508, 727729, 728181, 728396, 728838, 729099, 729600, 729855, 730291, 730524, 730979,
        731208, 731706, 731936, 732358, 732618, 733082, 733292, 733684, 733871, 734302, 734503, 734935, 735151, 735618,
      ],
      color: 'hsla(-1302147856,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{instance="localhost:10710",job="sample-metrics",pod_name="demoenv-003"}',
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      color: 'hsla(1617838252,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{instance="localhost:10709",job="trace-derived-metrics",pod_name="demoenv-001"}',
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      color: 'hsla(-372844748,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{instance="localhost:10709",job="trace-derived-metrics",pod_name="demoenv-002"}',
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      color: 'hsla(-545752568,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{cluster="default",instance="localhost:3030",job="test"}',
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      color: 'hsla(1723839280,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{instance="localhost:10709",job="trace-derived-metrics",pod_name="demoenv-003"}',
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      color: 'hsla(-29992088,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{instance="localhost:10710",job="sample-metrics",pod_name="demoenv-001"}',
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      color: 'hsla(1274985592,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: '{instance="localhost:10710",job="sample-metrics",pod_name="demoenv-002"}',
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      color: 'hsla(1102077772,50%,50%,0.8)',
      showSymbol: false,
      symbol: 'circle',
      sampling: 'lttb',
      progressiveThreshold: 500,
      lineStyle: {
        width: 1,
      },
      emphasis: {
        lineStyle: {
          width: 1.5,
        },
      },
      markLine: {},
    },
    {
      type: 'line',
      name: 'Threshold: WARN - Default Condition - Sustained for 60s',
      data: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      ],
      color: '#FFB249',
      showSymbol: false,
      symbol: 'circle',
      label: {
        show: false,
      },
      lineStyle: {
        type: 'dashed',
        width: 1.5,
      },
      emphasis: {
        lineStyle: {
          width: 2,
        },
      },
    },
    {
      type: 'scatter',
      xAxisIndex: 1,
      yAxisIndex: 1,
      // TODO: finalize data model for annotations, create mapping utils
      annotations: [
        {
          id: '0+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:23:15Z',
        },
        {
          id: '1+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:25:59Z',
        },
        {
          id: '2+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:25:59Z',
        },
      ],
      data: [
        {
          cursor: 'crosshair',
          symbol:
            'image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAACtklEQVR4AbVXPW8aQRB9u8IWsiKL1ElBfkEo0ttlQAq2U6YB5w8Y/wKDlMJdsCJTxmfs3mBLQHVxGlxEiklld6GJXAYlDVLgJjMH2GDuuL0EP+kOuJ3dd2/nYwcFA9DJagyRRwk4/XX+uQKFOH/GhsMdvlogfIPGuXpVr5isqYIJl7ZAlBsjCkIbSlmIOIcq2WgjLDGdpYQwH4Jw+gWgCipds2BKTKfJ9/yRw3xQVOn6NoKI6TR1wPcs5gplsfLN8Sd6klSUmpFWvvbx5bsDM1B2uIvTxKw0ixDbW/rUx26thxDIMXlugphOXsb5vmO6gqj98ZNwfUMoN/sIgR03U0bEiOgM3+MmM4VQ1I5Qsnv41SUYIga9lLsjJvNgqlwO1I7wuwscN019zVC0Jao1nSWlGsVN5rhq7YHaJ4+VewnKzd7EywSAi1I0oeFg1XTG+BZbbxdwwJdAVIcKNEeta87k5ya2okiCyg/2lRMivbAiPk6YWG5+/BNos28bRjgfMkIcWItH6RMEUWxfGZHHIiZW474dIeOzA7u1Pl4801iOzjz43HTqzDLYt70jdjkKPPXYK7E1SK8OB5dq+43KItVL70U+vFnAu9cLnmOSXgFFpcXpRJ/9RmWL/Xxbvujj+MLbn5JeJXuGau5WNDR5tipB6XPENXpWnT5i1dc3PuTcImn0oi14+NkroMJCAs0DbenL3NCjairPNdT4dPovEBXUWiM/OCScxSIContOaGMRlnxxidVGRUgLeHCw2mHneduBcENW5Gjbw0OB11bphnXLNzVeTVr8NIN5guiQ/Zodf6Tv26i1enauykXpPVJP4iE5tyck7Wgb/w6Jm+3BWh4cs2a6TaBGlsuqcU/mEhLtwekW1ca5b6YoGMJtkaRbGTQOcobf/WkjqfdceqUK9rqtWYQj/AVOKTMarohEWgAAAABJRU5ErkJggg==',
          itemStyle: {
            color: '#FFB249',
            opacity: 1,
          },
          symbolOffset: [0, 0],
          value: [1, 14],
          labelLine: {
            show: true,
          },
        },
      ],
      symbolSize: 30,
      name: 3, // TODO: why named 3 instead of a readable name?
      color: '#FFB249',
      labelLine: {
        show: true,
        lineStyle: {
          type: 'solid',
          width: 1,
          opacity: 1,
        },
      },
      label: {
        show: true,
        formatter: '',
        position: 'bottom',
        distance: TOOLTIP_PLUGIN_LABEL_DISTANCE,
      },
    },
    {
      type: 'scatter',
      xAxisIndex: 1,
      yAxisIndex: 1,
      annotations: [
        {
          id: '0+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:26:00Z',
        },
        {
          id: '1+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:28:44Z',
        },
        {
          id: '0+prevco',
          category: 'prevco',
          happened_at: '2023-06-09T13:26:00Z',
        },
      ],
      data: [
        {
          cursor: 'crosshair',
          symbol:
            'image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAACtklEQVR4AbVXPW8aQRB9u8IWsiKL1ElBfkEo0ttlQAq2U6YB5w8Y/wKDlMJdsCJTxmfs3mBLQHVxGlxEiklld6GJXAYlDVLgJjMH2GDuuL0EP+kOuJ3dd2/nYwcFA9DJagyRRwk4/XX+uQKFOH/GhsMdvlogfIPGuXpVr5isqYIJl7ZAlBsjCkIbSlmIOIcq2WgjLDGdpYQwH4Jw+gWgCipds2BKTKfJ9/yRw3xQVOn6NoKI6TR1wPcs5gplsfLN8Sd6klSUmpFWvvbx5bsDM1B2uIvTxKw0ixDbW/rUx26thxDIMXlugphOXsb5vmO6gqj98ZNwfUMoN/sIgR03U0bEiOgM3+MmM4VQ1I5Qsnv41SUYIga9lLsjJvNgqlwO1I7wuwscN019zVC0Jao1nSWlGsVN5rhq7YHaJ4+VewnKzd7EywSAi1I0oeFg1XTG+BZbbxdwwJdAVIcKNEeta87k5ya2okiCyg/2lRMivbAiPk6YWG5+/BNos28bRjgfMkIcWItH6RMEUWxfGZHHIiZW474dIeOzA7u1Pl4801iOzjz43HTqzDLYt70jdjkKPPXYK7E1SK8OB5dq+43KItVL70U+vFnAu9cLnmOSXgFFpcXpRJ/9RmWL/Xxbvujj+MLbn5JeJXuGau5WNDR5tipB6XPENXpWnT5i1dc3PuTcImn0oi14+NkroMJCAs0DbenL3NCjairPNdT4dPovEBXUWiM/OCScxSIContOaGMRlnxxidVGRUgLeHCw2mHneduBcENW5Gjbw0OB11bphnXLNzVeTVr8NIN5guiQ/Zodf6Tv26i1enauykXpPVJP4iE5tyck7Wgb/w6Jm+3BWh4cs2a6TaBGlsuqcU/mEhLtwekW1ca5b6YoGMJtkaRbGTQOcobf/WkjqfdceqUK9rqtWYQj/AVOKTMarohEWgAAAABJRU5ErkJggg==',
          itemStyle: {
            color: '#FFB249',
            opacity: 1,
          },
          symbolOffset: [15, 0],
          value: [2, 14],
          labelLine: {
            show: false,
          },
        },
        {
          cursor: 'crosshair',
          // TODO: make icons configurable (ex: Deploy specific icon here)
          symbol:
            'image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAADQklEQVR4AbVXTUwTQRR+M9sURCBVocBFaqIXOFgTf4409MTJHuTkoeVu0q54R44myraJ8SjtmQsnuFhS4kkxsR7gookrF0wp2iAglmXHeUt2WdrdnYnB79BOZr6db9+8n3lLQAIJ7WsEjM64oigpQsgYAxIDYJGTVdLg4yow9glMVik/GViU2ZOIBCl0ZwmQ3KmQcEudASuaYJQq6pDuy/JbSM7tZIGwp/KCHi9gmrMr09Gi56rX5Li2rfGFHJwD+D75N2q/6jF/FkmtPs+tzEAAjve2ofH2FdDwRei9lwalux8E8sWy2jflKyxjKYruLM9a/wgUvTIxIxRvtdwRHn9RyxBK5kGA2sIjR9QGivbdf2adQBCYeayuTA/mcUzxJ6FtxQilMyDAr48LbaIInDvYWBY9DoQqMwntZ8QRDkE4zd8nFvSQ2dyH319Wfdf315csjgARajZzjjATBBPiz+YHT2vdL4YcEfjJZtFqmnxeT4mstYS31p1x140EDDx8DdHJl3Dh+pgz3/y+ARLgR23EqUnNhAzb+KE74+74AyuQMKgwnWwc7egyW4HCWIpSQm/KkI/36s6YhLucMWseuDjbIAVe79HHcRmuO3B235UsEZzDSPfiCBAL/UstxugOinAJRKgsU1QcZDkO9+Q+FcPtVz+Ia7aDBhdmuoiFvusYGhXRQOmRFq5SkzGhs9CfocvDIhqEB0dgf2NJyMNuhSqEBLYqh5trcPhtzdpUhA7OQa6wkBBWoQaEqkF+PvhcsTZC/wX5ENcIDy7kulOsFbw862V1YJFW1EsNYrKCFwlz1a6/ePtgqfRDz61Jx1L8989pVsJfK50MGsp7WW1vhGmCUd01MgGdw3fatgoPjkLH1dvWi9op5ZXnaK0JZhHHp42AVsvxblJzE3ffl6wjxItANkftW+qI1/beu+lW4akVNXpWGJGcq+e547PwX8AKZTXqtFXtzd5crciLeBrOFazERTPumbaSWX7MCYwU4PxEC62insIn4n059AeTqGoBaBBgqvt43RB8wmzx6yuUMYGleeDFQFoQCgbs5SvqNd/6QEASvNFP8f40AVbjwPAOt69T3FznZXCVf9AtcsFqkKCNv7EFZVWvAaLUAAAAAElFTkSuQmCC',
          itemStyle: {
            color: '#438FEB',
            opacity: 1,
          },
          symbolOffset: [0, 0],
          value: [2, 14],
          labelLine: {
            show: true,
          },
        },
      ],
      symbolSize: 30,
      name: 3,
      color: '#438FEB',
      labelLine: {
        show: true,
        lineStyle: {
          type: 'solid',
          width: 1,
          opacity: 1,
        },
      },
      label: {
        show: true,
        formatter: '',
        position: 'bottom',
        distance: TOOLTIP_PLUGIN_LABEL_DISTANCE,
      },
    },
    {
      type: 'scatter',
      xAxisIndex: 1,
      yAxisIndex: 1,
      annotations: [
        {
          id: '0+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:28:45Z',
        },
      ],
      data: [
        {
          cursor: 'crosshair',
          symbol:
            'image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAACtklEQVR4AbVXPW8aQRB9u8IWsiKL1ElBfkEo0ttlQAq2U6YB5w8Y/wKDlMJdsCJTxmfs3mBLQHVxGlxEiklld6GJXAYlDVLgJjMH2GDuuL0EP+kOuJ3dd2/nYwcFA9DJagyRRwk4/XX+uQKFOH/GhsMdvlogfIPGuXpVr5isqYIJl7ZAlBsjCkIbSlmIOIcq2WgjLDGdpYQwH4Jw+gWgCipds2BKTKfJ9/yRw3xQVOn6NoKI6TR1wPcs5gplsfLN8Sd6klSUmpFWvvbx5bsDM1B2uIvTxKw0ixDbW/rUx26thxDIMXlugphOXsb5vmO6gqj98ZNwfUMoN/sIgR03U0bEiOgM3+MmM4VQ1I5Qsnv41SUYIga9lLsjJvNgqlwO1I7wuwscN019zVC0Jao1nSWlGsVN5rhq7YHaJ4+VewnKzd7EywSAi1I0oeFg1XTG+BZbbxdwwJdAVIcKNEeta87k5ya2okiCyg/2lRMivbAiPk6YWG5+/BNos28bRjgfMkIcWItH6RMEUWxfGZHHIiZW474dIeOzA7u1Pl4801iOzjz43HTqzDLYt70jdjkKPPXYK7E1SK8OB5dq+43KItVL70U+vFnAu9cLnmOSXgFFpcXpRJ/9RmWL/Xxbvujj+MLbn5JeJXuGau5WNDR5tipB6XPENXpWnT5i1dc3PuTcImn0oi14+NkroMJCAs0DbenL3NCjairPNdT4dPovEBXUWiM/OCScxSIContOaGMRlnxxidVGRUgLeHCw2mHneduBcENW5Gjbw0OB11bphnXLNzVeTVr8NIN5guiQ/Zodf6Tv26i1enauykXpPVJP4iE5tyck7Wgb/w6Jm+3BWh4cs2a6TaBGlsuqcU/mEhLtwekW1ca5b6YoGMJtkaRbGTQOcobf/WkjqfdceqUK9rqtWYQj/AVOKTMarohEWgAAAABJRU5ErkJggg==',
          itemStyle: {
            color: '#FFB249',
            opacity: 1,
          },
          symbolOffset: [0, 0],
          value: [3, 14],
          labelLine: {
            show: true,
          },
        },
      ],
      symbolSize: 30,
      name: 1,
      color: '#FFB249',
      labelLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          width: 1,
          opacity: 1,
        },
      },
      label: {
        show: true,
        formatter: '',
        position: 'bottom',
        distance: TOOLTIP_PLUGIN_LABEL_DISTANCE,
      },
    },
    {
      type: 'scatter',
      xAxisIndex: 1,
      yAxisIndex: 1,
      annotations: [
        {
          id: '0+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:31:30Z',
        },
        {
          id: '1+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:34:14Z',
        },
        {
          id: '2+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:34:14Z',
        },
      ],
      data: [
        {
          cursor: 'crosshair',
          symbol:
            'image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAACtklEQVR4AbVXPW8aQRB9u8IWsiKL1ElBfkEo0ttlQAq2U6YB5w8Y/wKDlMJdsCJTxmfs3mBLQHVxGlxEiklld6GJXAYlDVLgJjMH2GDuuL0EP+kOuJ3dd2/nYwcFA9DJagyRRwk4/XX+uQKFOH/GhsMdvlogfIPGuXpVr5isqYIJl7ZAlBsjCkIbSlmIOIcq2WgjLDGdpYQwH4Jw+gWgCipds2BKTKfJ9/yRw3xQVOn6NoKI6TR1wPcs5gplsfLN8Sd6klSUmpFWvvbx5bsDM1B2uIvTxKw0ixDbW/rUx26thxDIMXlugphOXsb5vmO6gqj98ZNwfUMoN/sIgR03U0bEiOgM3+MmM4VQ1I5Qsnv41SUYIga9lLsjJvNgqlwO1I7wuwscN019zVC0Jao1nSWlGsVN5rhq7YHaJ4+VewnKzd7EywSAi1I0oeFg1XTG+BZbbxdwwJdAVIcKNEeta87k5ya2okiCyg/2lRMivbAiPk6YWG5+/BNos28bRjgfMkIcWItH6RMEUWxfGZHHIiZW474dIeOzA7u1Pl4801iOzjz43HTqzDLYt70jdjkKPPXYK7E1SK8OB5dq+43KItVL70U+vFnAu9cLnmOSXgFFpcXpRJ/9RmWL/Xxbvujj+MLbn5JeJXuGau5WNDR5tipB6XPENXpWnT5i1dc3PuTcImn0oi14+NkroMJCAs0DbenL3NCjairPNdT4dPovEBXUWiM/OCScxSIContOaGMRlnxxidVGRUgLeHCw2mHneduBcENW5Gjbw0OB11bphnXLNzVeTVr8NIN5guiQ/Zodf6Tv26i1enauykXpPVJP4iE5tyck7Wgb/w6Jm+3BWh4cs2a6TaBGlsuqcU/mEhLtwekW1ca5b6YoGMJtkaRbGTQOcobf/WkjqfdceqUK9rqtWYQj/AVOKTMarohEWgAAAABJRU5ErkJggg==',
          itemStyle: {
            color: '#FFB249',
            opacity: 1,
          },
          symbolOffset: [0, 0],
          value: [4, 14],
          labelLine: {
            show: true,
          },
        },
      ],
      symbolSize: 30,
      name: 3,
      color: '#FFB249',
      labelLine: {
        show: true,
        lineStyle: {
          type: 'solid',
          width: 1,
          opacity: 1,
        },
      },
      label: {
        show: true,
        formatter: '',
        position: 'bottom',
        distance: TOOLTIP_PLUGIN_LABEL_DISTANCE,
      },
    },
    {
      type: 'scatter',
      xAxisIndex: 1,
      yAxisIndex: 1,
      annotations: [
        {
          id: '0+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:34:15Z',
        },
        {
          id: '1+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:36:30Z',
        },
        {
          id: '2+alerts',
          category: 'alerts',
          happened_at: '2023-06-09T13:36:30Z',
        },
      ],
      data: [
        {
          cursor: 'crosshair',
          symbol:
            'image://data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAACtklEQVR4AbVXPW8aQRB9u8IWsiKL1ElBfkEo0ttlQAq2U6YB5w8Y/wKDlMJdsCJTxmfs3mBLQHVxGlxEiklld6GJXAYlDVLgJjMH2GDuuL0EP+kOuJ3dd2/nYwcFA9DJagyRRwk4/XX+uQKFOH/GhsMdvlogfIPGuXpVr5isqYIJl7ZAlBsjCkIbSlmIOIcq2WgjLDGdpYQwH4Jw+gWgCipds2BKTKfJ9/yRw3xQVOn6NoKI6TR1wPcs5gplsfLN8Sd6klSUmpFWvvbx5bsDM1B2uIvTxKw0ixDbW/rUx26thxDIMXlugphOXsb5vmO6gqj98ZNwfUMoN/sIgR03U0bEiOgM3+MmM4VQ1I5Qsnv41SUYIga9lLsjJvNgqlwO1I7wuwscN019zVC0Jao1nSWlGsVN5rhq7YHaJ4+VewnKzd7EywSAi1I0oeFg1XTG+BZbbxdwwJdAVIcKNEeta87k5ya2okiCyg/2lRMivbAiPk6YWG5+/BNos28bRjgfMkIcWItH6RMEUWxfGZHHIiZW474dIeOzA7u1Pl4801iOzjz43HTqzDLYt70jdjkKPPXYK7E1SK8OB5dq+43KItVL70U+vFnAu9cLnmOSXgFFpcXpRJ/9RmWL/Xxbvujj+MLbn5JeJXuGau5WNDR5tipB6XPENXpWnT5i1dc3PuTcImn0oi14+NkroMJCAs0DbenL3NCjairPNdT4dPovEBXUWiM/OCScxSIContOaGMRlnxxidVGRUgLeHCw2mHneduBcENW5Gjbw0OB11bphnXLNzVeTVr8NIN5guiQ/Zodf6Tv26i1enauykXpPVJP4iE5tyck7Wgb/w6Jm+3BWh4cs2a6TaBGlsuqcU/mEhLtwekW1ca5b6YoGMJtkaRbGTQOcobf/WkjqfdceqUK9rqtWYQj/AVOKTMarohEWgAAAABJRU5ErkJggg==',
          itemStyle: {
            color: '#FFB249',
            opacity: 1,
          },
          symbolOffset: [0, 0],
          value: [5, 14],
          labelLine: {
            show: true,
          },
        },
      ],
      symbolSize: 30,
      name: 3,
      color: '#FFB249',
      labelLine: {
        show: true,
        lineStyle: {
          type: 'solid',
          width: 1,
          opacity: 1,
        },
      },
      label: {
        show: true,
        formatter: '',
        position: 'bottom',
        distance: TOOLTIP_PLUGIN_LABEL_DISTANCE,
      },
    },
  ],
  xAxis: [
    1686316965000, 1686316980000, 1686316995000, 1686317010000, 1686317025000, 1686317040000, 1686317055000,
    1686317070000, 1686317085000, 1686317100000, 1686317115000, 1686317130000, 1686317145000, 1686317160000,
    1686317175000, 1686317190000, 1686317205000, 1686317220000, 1686317235000, 1686317250000, 1686317265000,
    1686317280000, 1686317295000, 1686317310000, 1686317325000, 1686317340000, 1686317355000, 1686317370000,
    1686317385000, 1686317400000, 1686317415000, 1686317430000, 1686317445000, 1686317460000, 1686317475000,
    1686317490000, 1686317505000, 1686317520000, 1686317535000, 1686317550000, 1686317565000, 1686317580000,
    1686317595000, 1686317610000, 1686317625000, 1686317640000, 1686317655000, 1686317670000, 1686317685000,
    1686317700000, 1686317715000, 1686317730000, 1686317745000, 1686317760000, 1686317775000, 1686317790000,
  ],
  xAxisAlt: [1686316965000, 1686316995000, 1686317160000, 1686317325000, 1686317490000, 1686317655000],
} as EChartsDataFormat;
