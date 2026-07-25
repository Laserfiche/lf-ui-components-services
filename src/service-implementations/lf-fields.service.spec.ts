// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { FieldValues, TemplateFieldInfo } from '@laserfiche/types-lf-ui-components';
import { LfFieldsService } from './lf-fields.service.js';
import { TemplateFieldDefinitionCollectionResponse, TemplateFieldDefinition as ApiTemplateFieldInfo, FieldType, ListDynamicFieldValuesRequest } from '@laserfiche/lf-repository-api-client-v2';
import { RepositoryApiClientMockBuilder } from './repository-api-client-mock-builder.js';


function createApiTemplateFieldInfo(data: Partial<ApiTemplateFieldInfo>): ApiTemplateFieldInfo {
  return new ApiTemplateFieldInfo(data);
}

function createTemplateFieldDefinitionCollectionResponse(data: { value: ApiTemplateFieldInfo[] }): TemplateFieldDefinitionCollectionResponse {
  return new TemplateFieldDefinitionCollectionResponse(data);
}

const mockTemplateFields: ApiTemplateFieldInfo[] = [
  createApiTemplateFieldInfo({ id: 1, name: 'test', fieldType: FieldType.String, displayName: 'test' }),
  createApiTemplateFieldInfo({ id: 2, name: 'test', fieldType: FieldType.String, displayName: 'test' }),
];

const mockRepoClient = new RepositoryApiClientMockBuilder()
  .withEntriesClient({
    listDynamicFieldValues: jest.fn((args: { repositoryId: string, entryId: number, request: ListDynamicFieldValuesRequest }) => {
      return Promise.resolve({});
    }),
  })
  .withTemplateDefinitionsClient({
    listTemplateDefinitions: jest.fn((args: {
      repositoryId: string;
      templateName?: string;
      prefer?: string;
      culture?: string;
      select?: string;
      orderby?: string;
      top?: number;
      skip?: number;
      count?: boolean;
    }) => Promise.resolve(createTemplateFieldDefinitionCollectionResponse({ value: mockTemplateFields }))),
    listTemplateFieldDefinitionsByTemplateId: jest.fn((args: {
      repositoryId: string;
      templateId: number;
      prefer?: string;
      culture?: string;
      select?: string;
      orderby?: string;
      top?: number;
      skip?: number;
      count?: boolean;
    }) => {
      return Promise.resolve(createTemplateFieldDefinitionCollectionResponse({ value: mockTemplateFields }));
    }),
    listTemplateFieldDefinitionsByTemplateName: jest.fn((args: {
      repositoryId: string;
      templateName: string;
      prefer?: string;
      culture?: string;
      select?: string;
      orderby?: string;
      top?: number;
      skip?: number;
      count?: boolean;
    }) => Promise.resolve(createTemplateFieldDefinitionCollectionResponse({ value: mockTemplateFields }))),
  })
  .withGetCurrentRepoId(async () => { return 'r-23456789' })
  .withGetCurrentRepoName(async () => { return 'Test Name' })
  .build();

describe('LfFieldsService', () => {
  let service: LfFieldsService;
  beforeEach(() => {
    service = new LfFieldsService(mockRepoClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('get dynamic options: when field values are set, then it sends them to API', async () => {
    // Arrange
    const templateId = 123;
    let actualFieldValues: { [key: string]: string };
    mockRepoClient.entriesClient.listDynamicFieldValues = jest.fn(async ({ repositoryId, entryId, request }) => {
      actualFieldValues = request.fieldValues!;
      return {};
    });

    service.getTemplateFieldsAsync = jest.fn().mockResolvedValue([
      { id: 11, name: 'State', fieldType: FieldType.String, displayName: 'State' },
      { id: 12, name: 'County', fieldType: FieldType.String, displayName: 'County' },
      { id: 13, name: 'City', fieldType: FieldType.String, displayName: 'City' },
    ]);

    const fieldValues: FieldValues = {
      11: { fieldId: 11, fieldName: 'State', values: [{ value: 'CA', position: '1' }] },
    };

    // Act
    await service.getDynamicFieldValueOptionsAsync(templateId, fieldValues);

    // Assert
    expect(actualFieldValues!['State']).toEqual('CA');
  });

  it('get dynamic options: when no field values are set, then it can still get and return dynamic field value options', async () => {
    // Arrange
    const templateId = 123;
    const optionsByName: { [key: string]: string[] } = {
      'State': ['CA', 'OH', 'NV'],
      'County': [],
      'City': [],
    };
    mockRepoClient!.entriesClient.listDynamicFieldValues = jest.fn(() => Promise.resolve(optionsByName));

    const testReturn: TemplateFieldInfo[] = [
      { id: 11, name: 'State', fieldType: FieldType.String, displayName: 'State' },
      { id: 12, name: 'County', fieldType: FieldType.String, displayName: 'County' },
      { id: 13, name: 'City', fieldType: FieldType.String, displayName: 'City' },
    ];
    service.getTemplateFieldsAsync = jest.fn().mockResolvedValue(testReturn);

    // Act
    const options: { [fieldId: number]: string[] } = await service.getDynamicFieldValueOptionsAsync(templateId, {});

    // Assert
    expect(options).toEqual({
      11: ['CA', 'OH', 'NV'],
      12: [],
      13: [],
    });
  });

  it('get template definition: when no template definition is found for the id, then it returns undefined instead of throwing', async () => {
    // Arrange
    const templateId = 2147483646;
    mockRepoClient.templateDefinitionsClient.getTemplateDefinition = jest.fn().mockResolvedValue(undefined);

    // Act
    const result = await service.getTemplateDefinitionAsync(templateId);

    // Assert
    expect(result).toBeUndefined();
  });

  it('get template definition: when a template definition is found without a display name, then it falls back to the name', async () => {
    // Arrange
    const templateId = 123;
    mockRepoClient.templateDefinitionsClient.getTemplateDefinition = jest
      .fn()
      .mockResolvedValue({ id: templateId, name: 'MyTemplate' });

    // Act
    const result = await service.getTemplateDefinitionAsync(templateId);

    // Assert
    expect(result).toEqual({ id: templateId, name: 'MyTemplate', displayName: 'MyTemplate' });
  });

  it('get template definition: when the server fails to resolve the auto-select template id, then it returns undefined instead of throwing', async () => {
    // Arrange
    const autoSelectTemplateId = 2147483646;
    mockRepoClient.templateDefinitionsClient.getTemplateDefinition = jest
      .fn()
      .mockRejectedValue(new Error('some unknown error'));

    // Act
    const result = await service.getTemplateDefinitionAsync(autoSelectTemplateId);

    // Assert
    expect(result).toBeUndefined();
  });

  it('get template definition: when a non-auto-select template id fails, then it still throws', async () => {
    // Arrange
    const templateId = 123;
    mockRepoClient.templateDefinitionsClient.getTemplateDefinition = jest
      .fn()
      .mockRejectedValue({ status: 403, message: 'Access denied. [9013]' });

    // Act & Assert
    await expect(service.getTemplateDefinitionAsync(templateId)).rejects.toEqual({
      status: 403,
      message: 'Access denied. [9013]',
    });
  });

  it('get template definition: when the auto-select template id fails with an unrelated error, then it still returns undefined instead of throwing', async () => {
    // Arrange
    const autoSelectTemplateId = 2147483646;
    mockRepoClient.templateDefinitionsClient.getTemplateDefinition = jest
      .fn()
      .mockRejectedValue({ status: 500, message: 'Internal server error' });

    // Act
    const result = await service.getTemplateDefinitionAsync(autoSelectTemplateId);

    // Assert
    expect(result).toBeUndefined();
  });

  it('caches template fields', async () => {
    // Arrange
    const templateId = 123;

    await service.getTemplateFieldsAsync(templateId);

    // Act
    await service.getTemplateFieldsAsync(templateId);

    // Assert
    const expectedNumTimesCalled = 1;
    expect(mockRepoClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId).toHaveBeenCalledTimes(
      expectedNumTimesCalled
    );
  });

  it('caches template fields by template id', async () => {
    // Arrange
    const firstTemplateId = 123;
    const secondTemplateId = 234;

    // @ts-ignore completely reset the mock back to its initial state
    mockRepoClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId.mockReset();

    await service.getTemplateFieldsAsync(firstTemplateId);

    // Act
    await service.getTemplateFieldsAsync(secondTemplateId);

    // Assert
    const expectedNumTimesCalled = 2;
    expect(mockRepoClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateId).toHaveBeenCalledTimes(
      expectedNumTimesCalled
    );
  });

  it('caches template fields by template name', async () => {
    // Arrange
    const firstTemplateId = 'test 1';
    const secondTemplateId = 'test 2';
    await service.getTemplateFieldsAsync(firstTemplateId);
    await service.getTemplateFieldsAsync(firstTemplateId);

    // Act
    await service.getTemplateFieldsAsync(secondTemplateId);

    // Assert
    const expectedNumTimesCalled = 2;
    expect(mockRepoClient.templateDefinitionsClient.listTemplateFieldDefinitionsByTemplateName).toHaveBeenCalledTimes(
      expectedNumTimesCalled
    );
  });
});
