type unit = timeUnit | percentUnit | decimalUnit | bytesUnit;

interface timeUnit {
  decimal_places?: number;
  kind:
    | "Milliseconds"
    | "Seconds"
    | "Minutes"
    | "Hours"
    | "Days"
    | "Weeks"
    | "Months"
    | "Years";
}

interface percentUnit {
  decimal_places?: number;
  kind: "Percent" | "PercentDecimal";
}

interface decimalUnit {
  abbreviate?: boolean;
  decimal_places?: number;
  kind: "Decimal";
}

interface bytesUnit {
  abbreviate?: boolean;
  decimal_places?: number;
  kind: "Bytes";
}
