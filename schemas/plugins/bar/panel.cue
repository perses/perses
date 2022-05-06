package bar

#panel: {
  displayed_name: string,
  kind: "BarChart",
  chart: {
    bars: [...#bar]
  }
}

#bar: {
  expr: string
  legend?: string
}

#panel