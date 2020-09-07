/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DataObjectFactory } from "@fluidframework/aqueduct";
import { SyncedDataObject } from "@fluidframework/react";
/**
 * LikesAndComments example using multiple DDS hooks
 */
export declare class LikesAndComments extends SyncedDataObject {
    constructor(props: any);
    render(div: HTMLElement): HTMLElement;
}
export declare const LikesAndCommentsInstantiationFactory: DataObjectFactory<LikesAndComments, unknown, unknown>;
export declare const fluidExport: DataObjectFactory<LikesAndComments, unknown, unknown>;
//# sourceMappingURL=index.d.ts.map