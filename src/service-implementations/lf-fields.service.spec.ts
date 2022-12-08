import { FieldValues, FieldType, TemplateFieldInfo } from '@laserfiche/types-lf-ui-components';
import { LfFieldsService } from './lf-fields.service.js';
import { ODataValueContextOfIListOfTemplateFieldInfo, TemplateFieldInfo as ApiTemplateFieldInfo, WFieldType } from '@laserfiche/lf-repository-api-client';
import { RepositoryApiClientMockBuilder } from './repository-api-client-mock-builder.js';


function createApiTemplateFieldInfo(data) {
  return new ApiTemplateFieldInfo(data);
}

function createODataValueContextOfIListOfTemplateFieldInfo(data) {
  return new ODataValueContextOfIListOfTemplateFieldInfo(data);
}

const mockTemplateFields: ApiTemplateFieldInfo[] = [
  createApiTemplateFieldInfo({ id: 1, name: 'test', fieldType: WFieldType.String, displayName: 'test' }),
  createApiTemplateFieldInfo({ id: 2, name: 'test', fieldType: WFieldType.String, displayName: 'test' }),
];

const mockRepoClient = new RepositoryApiClientMockBuilder()
  .withEntriesClient({
    getDynamicFieldValues: jest.fn((args: { repoId: string, entryId: number }) => {
      return Promise.resolve({})
    }),
  })
  .withTemplateDefinitionsClient({
    getTemplateFieldDefinitionsByTemplateName: jest.fn((args: {
      repoId: string;
      templateName: string;
      prefer?: string;
      culture?: string;
      select?: string;
      orderby?: string;
      top?: number;
      skip?: number;
      count?: boolean;
    }) => Promise.resolve(createODataValueContextOfIListOfTemplateFieldInfo({ value: mockTemplateFields }))),
    getTemplateFieldDefinitions: jest.fn((args: {
      repoId: string;
      templateId: number;
      prefer?: string;
      culture?: string;
      select?: string;
      orderby?: string;
      top?: number;
      skip?: number;
      count?: boolean;
    }) => {
      return Promise.resolve(createODataValueContextOfIListOfTemplateFieldInfo({ value: mockTemplateFields }));
    })
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
    mockRepoClient.entriesClient.getDynamicFieldValues = jest.fn(async ({ repoId, entryId, request }) => {
      actualFieldValues = request!.fieldValues!;
      return {}
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
    mockRepoClient!.entriesClient.getDynamicFieldValues = jest.fn(() => Promise.resolve(optionsByName));

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

  it('caches template fields', async () => {
    // Arrange
    const templateId = 123;

    await service.getTemplateFieldsAsync(templateId);

    // Act
    await service.getTemplateFieldsAsync(templateId);

    // Assert
    const expectedNumTimesCalled = 1;
    expect(mockRepoClient.templateDefinitionsClient.getTemplateFieldDefinitions).toHaveBeenCalledTimes(
      expectedNumTimesCalled
    );
  });

  it('caches template fields by template id', async () => {
    // Arrange
    const firstTemplateId = 123;
    const secondTemplateId = 234;

    // @ts-ignore completely reset the mock back to its initial state
    mockRepoClient.templateDefinitionsClient.getTemplateFieldDefinitions.mockReset();

    await service.getTemplateFieldsAsync(firstTemplateId);

    // Act
    await service.getTemplateFieldsAsync(secondTemplateId);

    // Assert
    const expectedNumTimesCalled = 2;
    expect(mockRepoClient.templateDefinitionsClient.getTemplateFieldDefinitions).toHaveBeenCalledTimes(
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
    expect(mockRepoClient.templateDefinitionsClient.getTemplateFieldDefinitionsByTemplateName).toHaveBeenCalledTimes(
      expectedNumTimesCalled
    );
  });
});
