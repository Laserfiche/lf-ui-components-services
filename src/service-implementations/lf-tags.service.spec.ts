// Copyright Laserfiche.

import { TagDefinition } from '@laserfiche/lf-repository-api-client-v2';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex';
import { LfRepoTagsService } from './lf-tags.service';

type ListTagDefinitionsForEachArgs = {
  repositoryId: string;
  callback: (response: { value?: TagDefinition[] }) => Promise<boolean>;
};

describe('LfRepoTagsService', () => {
  it('returns empty list when tagDefinitionsClient is unavailable', async () => {
    const service = new LfRepoTagsService({} as unknown as IRepositoryApiClientEx);

    const result = await service.getTagDefinitions();

    expect(result).toEqual([]);
  });

  it('gets all pages and converts tag definitions', async () => {
    const listTagDefinitionsForEach = jest.fn(async ({ callback }: ListTagDefinitionsForEachArgs) => {
      await callback({
        value: [
          new TagDefinition({
            id: 1,
            name: 'tag-1',
            displayName: 'Tag 1',
            description: 'first',
            isSecure: true,
          }),
        ],
      });
      await callback({
        value: [
          new TagDefinition({
            id: 2,
            name: 'tag-2',
            displayName: 'Tag 2',
            isSecure: false,
          }),
        ],
      });
    });

    const repoClient = {
      getCurrentRepoId: jest.fn(async () => 'r-23456789'),
      tagDefinitionsClient: {
        listTagDefinitionsForEach,
      },
    } as unknown as IRepositoryApiClientEx;

    const service = new LfRepoTagsService(repoClient);

    const result = await service.getTagDefinitions();

    expect(repoClient.getCurrentRepoId).toHaveBeenCalledTimes(1);
    expect(listTagDefinitionsForEach).toHaveBeenCalledWith(
      expect.objectContaining({ repositoryId: 'r-23456789' })
    );
    expect(result).toEqual([
      {
        id: 1,
        name: 'tag-1',
        displayName: 'Tag 1',
        description: 'first',
        isSecure: true,
      },
      {
        id: 2,
        name: 'tag-2',
        displayName: 'Tag 2',
        isSecure: false,
      },
    ]);
  });

  it('stops paging when callback receives an empty page', async () => {
    let shouldContinueOnEmptyPage: boolean | undefined;
    const listTagDefinitionsForEach = jest.fn(async ({ callback }: ListTagDefinitionsForEachArgs) => {
      shouldContinueOnEmptyPage = await callback({ value: [] });
    });

    const repoClient = {
      getCurrentRepoId: jest.fn(async () => 'r-23456789'),
      tagDefinitionsClient: {
        listTagDefinitionsForEach,
      },
    } as unknown as IRepositoryApiClientEx;

    const service = new LfRepoTagsService(repoClient);

    const result = await service.getTagDefinitions();

    expect(result).toEqual([]);
    expect(shouldContinueOnEmptyPage).toBe(false);
  });
});
