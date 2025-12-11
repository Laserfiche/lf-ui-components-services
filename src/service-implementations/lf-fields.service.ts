// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import {
  FieldValue,
  FieldValues,
  LfFieldContainerService,
  LfFieldInfo,
  TemplateFieldInfo,
  TemplateInfo,
} from '@laserfiche/types-lf-ui-components';
import { LfDefaultFieldsService } from '../helper-types/lf-default-fields.service.js';
import { convertApiToLfFieldInfo, convertApiToLfTemplateFieldInfo } from '../utils/types-utils.js';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';
import {
  ListDynamicFieldValuesRequest,
  TemplateFieldDefinitionCollectionResponse,
  FieldDefinitionCollectionResponse,
  TemplateDefinitionCollectionResponse,
  FieldDefinition,
  TemplateDefinition,
  TemplateFieldDefinition as ApiTemplateFieldInfo,
} from '@laserfiche/lf-repository-api-client-v2';

export class LfFieldsService implements LfFieldContainerService {
  private cachedFieldDefinitions: FieldDefinition[] | undefined;
  private cachedTemplateFields: { id: number | string; fieldInfos: ApiTemplateFieldInfo[] } | undefined;
  private cachedTemplateDefinitions: TemplateInfo[] | undefined;
  private templateChanged: boolean = false;

  constructor(private repoClient: IRepositoryApiClientEx, private lfDefaultFieldsService?: LfDefaultFieldsService) { }

  async getAllFieldDefinitionsAsync(): Promise<LfFieldInfo[]> {
    const fieldDefinitions: FieldDefinition[] = (await this.getUnfilteredFieldDefinitionsAsync()) ?? [];
    const lfFieldDefinitions: LfFieldInfo[] = fieldDefinitions.map(convertApiToLfFieldInfo);
    return lfFieldDefinitions;
  }

  async getTemplateDefinitionAsync(templateIdentifier: number | string): Promise<TemplateInfo | undefined> {
    let templateDefinition: TemplateDefinition | undefined;
    const repositoryId = await this.repoClient.getCurrentRepoId();
    if (typeof templateIdentifier === 'string') {
      const templateDefinitions: TemplateDefinitionCollectionResponse =
        await this.repoClient?.templateDefinitionsClient.listTemplateDefinitions({
          repositoryId,
          templateName: templateIdentifier,
        });
      templateDefinition = templateDefinitions.value?.[0];
    } else {
      templateDefinition = await this.repoClient?.templateDefinitionsClient.getTemplateDefinition({
        repositoryId,
        templateId: templateIdentifier,
      });
    }
    if (!templateDefinition?.displayName) {
      templateDefinition!.displayName = templateDefinition?.name;
    }
    return templateDefinition as TemplateInfo;
  }

  async getUnfilteredFieldDefinitionsAsync(): Promise<FieldDefinition[]> {
    if (this.cachedFieldDefinitions) {
      return this.cachedFieldDefinitions;
    } else {
      const repositoryId = await this.repoClient.getCurrentRepoId();
      const response: FieldDefinitionCollectionResponse = await this.repoClient.fieldDefinitionsClient.listFieldDefinitions({
        repositoryId,
      });
      this.cachedFieldDefinitions = response.value ?? [];
      return response.value ?? [];
    }
  }

  async getDefaultFieldValuesAsync(): Promise<FieldValue[]> {
    const values = await this.getDefaultValuesAsync();
    const fieldValues: FieldValue[] = values.map((value) => value.value);
    return fieldValues;
  }

  async getAvailableTemplatesAsync(): Promise<TemplateInfo[]> {
    if (!this.cachedTemplateDefinitions) {
      const repositoryId = await this.repoClient.getCurrentRepoId();
      const templateInfo: TemplateDefinitionCollectionResponse =
        await this.repoClient.templateDefinitionsClient.listTemplateDefinitions({ repositoryId });
      const templates = templateInfo.value as TemplateDefinition[];
      templates.forEach((template) => {
        if (!template.displayName) {
          template.displayName = template.name;
        }
      });
      this.cachedTemplateDefinitions = templateInfo.value as TemplateInfo[];
    }
    return this.cachedTemplateDefinitions;
  }

  async getTemplateFieldsAsync(templateIdentifier: number | string): Promise<TemplateFieldInfo[]> {
    let apiTemplateFieldInfos: ApiTemplateFieldInfo[] = [];
    if (this.cachedTemplateFields && this.cachedTemplateFields.id === templateIdentifier) {
      console.debug(`Using cached template fields for template ${templateIdentifier}`);
      apiTemplateFieldInfos = this.cachedTemplateFields.fieldInfos;
    } else {
      const repositoryId = await this.repoClient.getCurrentRepoId();
      if (typeof templateIdentifier === 'string') {
        const apiTemplateResponse: TemplateFieldDefinitionCollectionResponse =
          await this.repoClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateName({
            repositoryId,
            templateName: templateIdentifier,
          });

        apiTemplateFieldInfos = apiTemplateResponse?.value ?? [];
      } else {
        const apiTemplateResponse: TemplateFieldDefinitionCollectionResponse =
          await this.repoClient?.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId({
            repositoryId,
            templateId: templateIdentifier,
          });
        apiTemplateFieldInfos = apiTemplateResponse?.value ?? [];
      }
      this.cachedTemplateFields = { id: templateIdentifier, fieldInfos: apiTemplateFieldInfos };
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
      return Promise.resolve({});
    }

    const currentDynamicValues: { [key: string]: string } = this.getDynamicFieldValues(currentValues);
    const dynamicRequest: ListDynamicFieldValuesRequest = new ListDynamicFieldValuesRequest({
      templateId: templateId,
      fieldValues: currentDynamicValues
    });

    // Have to call listDynamicFieldValues on an entry but we don't have an entry yet
    const hardcodedRootEntryId: number = 1;
    const repositoryId = await this.repoClient.getCurrentRepoId();
    const response = await this.repoClient.entriesClient.listDynamicFieldValues({
      repositoryId,
      entryId: hardcodedRootEntryId,
      request: dynamicRequest,
    });
    const optionsByName = response;
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
    const fieldInfos: FieldDefinition[] = this.getAllCachedFieldInfos();
    const values: { value: FieldValue; definition: LfFieldInfo }[] =
      (await this.lfDefaultFieldsService?.getDefaultFieldInfoAsync(fieldInfos)) ?? [];
    return values;
  }

  private getAllCachedFieldInfos() {
    const fieldDefinitions: FieldDefinition[] = this.cachedFieldDefinitions ?? [];
    const templateFieldDefinitions: ApiTemplateFieldInfo[] = this.cachedTemplateFields?.fieldInfos ?? [];
    const fieldInfos: FieldDefinition[] = [...fieldDefinitions, ...templateFieldDefinitions];
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
