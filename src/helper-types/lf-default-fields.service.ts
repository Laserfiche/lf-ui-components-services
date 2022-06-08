import { WFieldInfo } from '@laserfiche/lf-repository-api-client';
import { FieldValue, LfFieldInfo } from '@laserfiche/types-laserfiche-ui-components';

export abstract class LfDefaultFieldsService {
    abstract getDefaultFieldInfoAsync(fieldInfos: WFieldInfo[]): Promise<{ value: FieldValue; definition: LfFieldInfo }[]>;
}
