// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { IRepositoryApiClient } from '@laserfiche/lf-repository-api-client';

export interface IRepositoryApiClientEx extends IRepositoryApiClient {
    getCurrentRepoId: () => Promise<string>;
    getCurrentRepoName: () => Promise<string>;
}
