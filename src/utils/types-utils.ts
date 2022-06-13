import { LfFieldInfo, TemplateFieldInfo, FieldType, FieldFormat } from '@laserfiche/types-lf-ui-components';
import { WFieldInfo, WFieldType, WFieldFormat, TemplateFieldInfo as ApiTemplateFieldInfo } from '@laserfiche/lf-repository-api-client';
import { validateDefined } from '@laserfiche/lf-js-utils';

/** @internal */
export function convertApiToLfFieldInfo(val: WFieldInfo): LfFieldInfo {
  const id = validateDefined(val.id, 'id');
  const name = validateDefined(val.name, 'name')!;
  const fieldType = convertApiToLfFieldType(validateDefined(val.fieldType, 'fieldType'));
  const format = val.format !== undefined ? convertApiToLfFieldFormat(val.format) : undefined;
  const result: LfFieldInfo = {
    ...val,
    name,
    id,
    fieldType,
    format
  };

  if (result.format === undefined) {
    delete result.format;
  }

  return result;
}

/** @internal */
export function convertLfToApiFieldInfo(val: LfFieldInfo): WFieldInfo {
  const fieldType = convertLfToApiFieldType(val.fieldType);
  const format = val.format !== undefined ? convertLfToApiFieldFormat(val.format) : undefined;
  const result: WFieldInfo = new WFieldInfo({
    ...val,
    fieldType,
    format,
  });

  if (result.format === undefined) {
    delete result.format;
  }

  return result;
}

/** @internal */
export function convertLfToApiTemplateFieldInfo(val: TemplateFieldInfo): ApiTemplateFieldInfo {
  const result = convertLfToApiFieldInfo(val);
  return result;
}

/** @internal */
export function convertApiToLfTemplateFieldInfo(val: ApiTemplateFieldInfo): TemplateFieldInfo {
  const result = convertApiToLfFieldInfo(val);
  return result;
}

/** @internal */
export function convertApiToLfFieldType(val: WFieldType): FieldType {
  switch (val) {
    case WFieldType.Blob:
      return FieldType.Blob;
    case WFieldType.Date:
      return FieldType.Date;
    case WFieldType.DateTime:
      return FieldType.DateTime;
    case WFieldType.List:
      return FieldType.List;
    case WFieldType.LongInteger:
      return FieldType.LongInteger;
    case WFieldType.Number:
      return FieldType.Number;
    case WFieldType.ShortInteger:
      return FieldType.ShortInteger;
    case WFieldType.String:
      return FieldType.String;
    case WFieldType.Time:
      return FieldType.Time;
  }
}

/** @internal */
export function convertLfToApiFieldType(val: FieldType): WFieldType {
  switch (val) {
    case FieldType.Blob:
      return WFieldType.Blob;
    case FieldType.Date:
      return WFieldType.Date;
    case FieldType.DateTime:
      return WFieldType.DateTime;
    case FieldType.List:
      return WFieldType.List;
    case FieldType.LongInteger:
      return WFieldType.LongInteger;
    case FieldType.Number:
      return WFieldType.Number;
    case FieldType.ShortInteger:
      return WFieldType.ShortInteger;
    case FieldType.String:
      return WFieldType.String;
    case FieldType.Time:
      return WFieldType.Time;
  }
}

/** @internal */
export function convertApiToLfFieldFormat(val: WFieldFormat): FieldFormat {
  switch (val) {
    case WFieldFormat.Currency:
      return FieldFormat.Currency;
    case WFieldFormat.Custom:
      return FieldFormat.Custom;
    case WFieldFormat.GeneralNumber:
      return FieldFormat.GeneralNumber;
    case WFieldFormat.LongDate:
      return FieldFormat.LongDate;
    case WFieldFormat.LongDateTime:
      return FieldFormat.LongDateTime;
    case WFieldFormat.LongTime:
      return FieldFormat.LongTime;
    case WFieldFormat.None:
      return FieldFormat.None;
    case WFieldFormat.Percent:
      return FieldFormat.Percent;
    case WFieldFormat.Scientific:
      return FieldFormat.Scientific;
    case WFieldFormat.ShortDate:
      return FieldFormat.ShortDate;
    case WFieldFormat.ShortDateTime:
      return FieldFormat.ShortDateTime;
    case WFieldFormat.ShortTime:
      return FieldFormat.ShortTime;
  }
}

/** @internal */
export function convertLfToApiFieldFormat(val: FieldFormat): WFieldFormat {
  switch (val) {
    case FieldFormat.Currency:
      return WFieldFormat.Currency;
    case FieldFormat.Custom:
      return WFieldFormat.Custom;
    case FieldFormat.GeneralNumber:
      return WFieldFormat.GeneralNumber;
    case FieldFormat.LongDate:
      return WFieldFormat.LongDate;
    case FieldFormat.LongDateTime:
      return WFieldFormat.LongDateTime;
    case FieldFormat.LongTime:
      return WFieldFormat.LongTime;
    case FieldFormat.None:
      return WFieldFormat.None;
    case FieldFormat.Percent:
      return WFieldFormat.Percent;
    case FieldFormat.Scientific:
      return WFieldFormat.Scientific;
    case FieldFormat.ShortDate:
      return WFieldFormat.ShortDate;
    case FieldFormat.ShortDateTime:
      return WFieldFormat.ShortDateTime;
    case FieldFormat.ShortTime:
      return WFieldFormat.ShortTime;
  }
}
