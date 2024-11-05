import { MappedValue, ValueMapping } from '../model';

export function applyValueMapping(value: number | string, mappings: ValueMapping[] = []): MappedValue {
  if (!mappings.length) {
    return { value };
  }

  const mappedItem: MappedValue = { value };

  mappings.forEach((mapping) => {
    switch (mapping.kind) {
      case 'Value': {
        const valueOptions = mapping.spec;

        if (String(valueOptions.value) === String(value)) {
          mappedItem.value = valueOptions.result.value;
          mappedItem.color = valueOptions.result.color;
        }
        break;
      }
      case 'Range': {
        const rangeOptions = mapping.spec;
        const newValue = value as number;
        if (newValue >= rangeOptions.from && newValue <= rangeOptions.to) {
          mappedItem.value = rangeOptions.result.value;
          mappedItem.color = rangeOptions.result.color;
        }
        break;
      }
      case 'Regex': {
        const regexOptions = mapping.spec;
        const regex = new RegExp(regexOptions.pattern);
        if (regex.test(value.toString())) {
          mappedItem.value = regexOptions.result.value;
          mappedItem.color = regexOptions.result.color;
        }
        break;
      }
      case 'Misc': {
        const miscOptions = mapping.spec;
        if (isMiscValueMatch(miscOptions.value, value)) {
          mappedItem.value = miscOptions.result.value;
          mappedItem.color = miscOptions.result.color;
        }
        break;
      }
      default:
        break;
    }
  });
  return mappedItem;
}

function isMiscValueMatch(miscValue: string, value: number | string | boolean): boolean {
  switch (miscValue) {
    case 'empty':
      return value === '';
    case 'null':
      return value === null || value === undefined;
    case 'NaN':
      return Number.isNaN(value);
    case 'true':
      return value === true;
    case 'false':
      return value === false;
    default:
      return false;
  }
}
