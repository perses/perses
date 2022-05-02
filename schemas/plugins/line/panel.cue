package line

#panel: {
  displayed_name: string
  kind: "LineChart"
  chart: {
    show_legend?: bool
    lines: [...#line]
  }
}

#line: {
  expr: string
}

#panel