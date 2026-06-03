// Copyright Laserfiche.

import { LfTagsService, LfTagDefinition } from '@laserfiche/types-lf-ui-components';
import { convertTagDefinition } from '../utils/types-utils.js';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';
import { TagDefinition } from '@laserfiche/lf-repository-api-client-v2';

export class LfRepoTagsService implements LfTagsService {
  constructor(private repoClient: IRepositoryApiClientEx) {}

  async getTagDefinitions(): Promise<LfTagDefinition[]> {
    if (!this.repoClient?.tagDefinitionsClient) {
      return [];
    }

    const allTags: LfTagDefinition[] = [];
    const repositoryId = await this.repoClient.getCurrentRepoId();

    const callback = async (response: { value?: TagDefinition[] }): Promise<boolean> => {
      if (!response.value || response.value.length === 0) {
        return false;
      }

      allTags.push(...response.value.map(convertTagDefinition));
      return true;
    };

    await this.repoClient.tagDefinitionsClient.listTagDefinitionsForEach({ callback, repositoryId });
    return allTags;
  }
}
