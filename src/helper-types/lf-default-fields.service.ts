// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { WFieldInfo } from '@laserfiche/lf-repository-api-client';
import { FieldValue, LfFieldInfo } from '@laserfiche/types-lf-ui-components';

export abstract class LfDefaultFieldsService {
    abstract getDefaultFieldInfoAsync(fieldInfos: WFieldInfo[]): Promise<{ value: FieldValue; definition: LfFieldInfo }[]>;
}
