// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { FieldDefinition } from '@laserfiche/lf-repository-api-client-v2';
import { FieldValue, LfFieldInfo } from '@laserfiche/types-lf-ui-components';

export abstract class LfDefaultFieldsService {
    abstract getDefaultFieldInfoAsync(fieldInfos: FieldDefinition[]): Promise<{ value: FieldValue; definition: LfFieldInfo }[]>;
}
