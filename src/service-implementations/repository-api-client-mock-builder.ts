// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { IEntriesClient, ITemplateDefinitionsClient } from '@laserfiche/lf-repository-api-client-v2';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';

export class RepositoryApiClientMockBuilder {
  private _entriesClient: IEntriesClient | null = null;
  private _templateDefinitionsClient: ITemplateDefinitionsClient | null = null;
  private _repositoryId: (() => Promise<string>) | null = null;
  private _repositoryName: (() => Promise<string>) | null = null;

  build(): IRepositoryApiClientEx {
    return {
      entriesClient: this._entriesClient,
      templateDefinitionsClient: this._templateDefinitionsClient,
      getCurrentRepoId: this._repositoryId,
      getCurrentRepoName: this._repositoryName,
    } as IRepositoryApiClientEx;
  }

  withGetCurrentRepoId(repositoryId: () => Promise<string>): RepositoryApiClientMockBuilder {
    this._repositoryId = repositoryId;
    return this;
  }

  withGetCurrentRepoName(repositoryName: () => Promise<string>): RepositoryApiClientMockBuilder {
    this._repositoryName = repositoryName;
    return this;
  }

  withEntriesClient(entriesClient: Partial<IEntriesClient>): RepositoryApiClientMockBuilder {
    this._entriesClient = entriesClient as IEntriesClient;
    return this;
  }

  withTemplateDefinitionsClient(
    templateDefinitionsClient: Partial<ITemplateDefinitionsClient>
  ): RepositoryApiClientMockBuilder {
    this._templateDefinitionsClient = templateDefinitionsClient as ITemplateDefinitionsClient;
    return this;
  }
}
