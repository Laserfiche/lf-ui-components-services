import {
  FieldValue, FieldValues, LfFieldContainerService, LfFieldInfo,
  TemplateFieldInfo, TemplateInfo
} from '@laserfiche/types-lf-ui-components';
import { LfDefaultFieldsService } from '../helper-types/lf-default-fields.service.js';
import { convertApiToLfFieldInfo, convertApiToLfTemplateFieldInfo } from '../utils/types-utils.js';
import {
  GetDynamicFieldLogicValueRequest,
  ODataValueOfIListOfWFieldInfo,
  ODataValueOfIListOfWTemplateInfo,
  WFieldInfo,
  WTemplateInfo,
  TemplateFieldInfo as ApiTemplateFieldInfo,
  ODataValueOfIListOfTemplateFieldInfo,
} from '@laserfiche/lf-repository-api-client';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';

export class LfFieldsService implements LfFieldContainerService {
  private cachedFieldDefinitions: WFieldInfo[] | undefined;
  private cachedTemplateFields: { id: number | string; fieldInfos: ApiTemplateFieldInfo[] } | undefined;
  private cachedTemplateDefinitions: TemplateInfo[] | undefined;
  private templateChanged: boolean = false;

  constructor(
    private repoClient: IRepositoryApiClientEx,
    private lfDefaultFieldsService?: LfDefaultFieldsService,
  ) { }

  async getAllFieldDefinitionsAsync(): Promise<LfFieldInfo[]> {
    const fieldDefinitions: WFieldInfo[] = (await this.getUnfilteredFieldDefinitionsAsync()) ?? [];
    const lfFieldDefinitions: LfFieldInfo[] = fieldDefinitions.map(convertApiToLfFieldInfo);
    return lfFieldDefinitions;
  }

  async getTemplateDefinitionAsync(templateIdentifier: number | string): Promise<TemplateInfo | undefined> {
    let templateDefinition: WTemplateInfo | undefined;
    const repoId = await this.repoClient.getCurrentRepoId();
    if (typeof (templateIdentifier) === 'string') {
      const templateDefinitions: ODataValueOfIListOfWTemplateInfo =
        await this.repoClient?.templateDefinitionsClient.getTemplateDefinitions({ repoId, templateName: templateIdentifier });
      templateDefinition = templateDefinitions.value[0]
    }
    else {
      templateDefinition =
        await this.repoClient?.templateDefinitionsClient.getTemplateDefinitionById({ repoId, templateId: templateIdentifier })
    }
    return templateDefinition as TemplateInfo;
  }

  async getUnfilteredFieldDefinitionsAsync(): Promise<WFieldInfo[]> {
    if (this.cachedFieldDefinitions) {
      return this.cachedFieldDefinitions;
    } else {
      const repoId = await this.repoClient.getCurrentRepoId();
      const response: ODataValueOfIListOfWFieldInfo = await this.repoClient.fieldDefinitionsClient.getFieldDefinitions({ repoId });
      this.cachedFieldDefinitions = response.value;
      return response.value;
    }
    return [];
  }

  async getDefaultFieldValuesAsync(): Promise<FieldValue[]> {
    const values = await this.getDefaultValuesAsync();
    const fieldValues: FieldValue[] = values.map((value) => value.value);
    return fieldValues;
  }

  async getAvailableTemplatesAsync(): Promise<TemplateInfo[]> {
    if (!this.cachedTemplateDefinitions) {
      const repoId = await this.repoClient.getCurrentRepoId();
      const templateInfo: ODataValueOfIListOfWTemplateInfo = await this.repoClient.templateDefinitionsClient.getTemplateDefinitions({ repoId });
      this.cachedTemplateDefinitions = templateInfo.value as TemplateInfo[];
    }
    return this.cachedTemplateDefinitions;
  }

  async getTemplateFieldsAsync(templateIdentifier: number | string): Promise<TemplateFieldInfo[]> {
    let apiTemplateFieldInfos: ApiTemplateFieldInfo[] = [];
    if (this.cachedTemplateFields && this.cachedTemplateFields.id === templateIdentifier) {
      // eslint-disable-next-line no-restricted-syntax
      console.debug(`Using cached template fields for template ${templateIdentifier}`);
      apiTemplateFieldInfos = this.cachedTemplateFields.fieldInfos;
    }
    else {
      const repoId = await this.repoClient.getCurrentRepoId();
      if (typeof (templateIdentifier) === 'string') {
        const apiTemplateResponse: ODataValueOfIListOfTemplateFieldInfo = await this.repoClient.templateDefinitionsClient.getTemplateFieldDefinitionsByTemplateName(
          { repoId, templateName: templateIdentifier }
        );

        apiTemplateFieldInfos = apiTemplateResponse?.value ?? [];
      }
      else {
        const apiTemplateResponse: ODataValueOfIListOfTemplateFieldInfo = await this.repoClient?.templateDefinitionsClient.getTemplateFieldDefinitions(
          { repoId, templateId: templateIdentifier }
        );
        apiTemplateFieldInfos = apiTemplateResponse?.value ?? [];
      }
      this.cachedTemplateFields = { id: templateIdentifier, fieldInfos: apiTemplateFieldInfos };
      // eslint-disable-next-line no-restricted-syntax
      console.debug(`Cached ${apiTemplateFieldInfos.length} template fields for template ${templateIdentifier}`);
    }
    const templateFieldInfos: TemplateFieldInfo[] = apiTemplateFieldInfos.map(convertApiToLfTemplateFieldInfo);
    return templateFieldInfos;
  }

  async getDynamicFieldValueOptionsAsync(
    templateId: number,
    currentValues: FieldValues
  ): Promise<{ [fieldId: number]: string[] }> {
    if (!this.repoClient) {
      return {};
    }

    const currentDynamicValues: { [key: string]: string } = this.getDynamicFieldValues(currentValues);
    const dynamicRequest: GetDynamicFieldLogicValueRequest = {
      templateId,
      fieldValues: currentDynamicValues,
      init: undefined,
      toJSON: undefined
    };

    // Have to call get_dynamic_field_values on an entry but we don't have an entry yet
    const hardcodedRootEntryId: number = 1;
    const repoId = await this.repoClient.getCurrentRepoId();
    const response = await this.repoClient.entriesClient.getDynamicFieldValues(
      {
        repoId,
        entryId: hardcodedRootEntryId,
        request: dynamicRequest
      }
    );
    const optionsByName: { [key: string]: string[] } = response;
    const optionsById: { [fieldId: number]: string[] } = {};
    const fieldInfos: TemplateFieldInfo[] = await this.getTemplateFieldsAsync(templateId);

    for (const fieldName in optionsByName) {
      const options = optionsByName[fieldName];
      const fieldInfo: TemplateFieldInfo | undefined = fieldInfos.find((info) => info.name === fieldName);
      if (fieldInfo) {
        optionsById[fieldInfo.id] = options;
      } else {
        console.warn(`getDynamicFieldValueOptionsAsync: Field ${fieldName} not found`);
      }
    }

    return optionsById;
  }

  private async getDefaultValuesAsync(): Promise<{ value: FieldValue; definition: LfFieldInfo }[]> {
    const fieldInfos: WFieldInfo[] = this.getAllCachedFieldInfos();
    const values: { value: FieldValue; definition: LfFieldInfo }[] =
      (await this.lfDefaultFieldsService?.getDefaultFieldInfoAsync(fieldInfos)) ?? [];
    return values;
  }

  private getAllCachedFieldInfos() {
    const fieldDefinitions: WFieldInfo[] = this.cachedFieldDefinitions ?? [];
    const templateDefinitions: ApiTemplateFieldInfo[] = this.cachedTemplateFields?.fieldInfos ?? [];
    const fieldInfos: WFieldInfo[] = [...fieldDefinitions, ...templateDefinitions];
    return fieldInfos;
  }

  private getDynamicFieldValues(currentValues: FieldValues): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (const valAsAny of Object.values(currentValues)) {
      const fieldValue: FieldValue = valAsAny;
      const name = fieldValue.fieldName;
      if (!name) {
        console.warn(`Dynamic field ${fieldValue.fieldId} name not found`);
        continue;
      }

      const firstValue = this.getFirstFieldValue(currentValues, Number(fieldValue.fieldId));
      if (firstValue === undefined) {
        continue;
      }
      result[name] = firstValue;
    }
    return result;
  }

  private getFirstFieldValue(fieldValues: FieldValues, fieldId: number): string | undefined {
    let result: string | undefined;
    const values = fieldValues[fieldId]?.values ?? undefined;
    if (values && values.length > 0) {
      result = values[0].value;
    }
    return result;
  }

  get templateWasManuallyChanged(): boolean {
    return this.templateChanged;
  }

  set templateWasManuallyChanged(templateChanged: boolean) {
    this.templateChanged = templateChanged;
  }
}
