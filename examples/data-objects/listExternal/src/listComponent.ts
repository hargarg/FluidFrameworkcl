/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IRequest,
    IResponse,
    IFluidHandle,
} from "@fluidframework/core-interfaces";
import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";
import { SharedDirectory, IDirectoryValueChanged } from "@fluidframework/map";
import { v4 as uuid } from "uuid";
import { ConfigKey } from "./configKey";

// Sample agent to run.
export class ListComponent extends DataObject {
    private lists?: SharedDirectory;

    /**
     *
     */
    public static getFactory() {
        return ListComponent.factory;
    }

    private static readonly factory = new DataObjectFactory(
        "ListComponent",
        ListComponent,
        [SharedDirectory.getFactory()],
        {},
        [],
        true,
    );

    protected async initializingFirstTime() {
        const lists = SharedDirectory.create(this.runtime, "lists");
        this.root.set("lists", lists.handle);

        this.root.set(ConfigKey.docId, this.runtime.id);
    }

    protected async hasInitialized() {
        const [listsHandle] = await Promise.all([
            this.root.wait<IFluidHandle<SharedDirectory>>("lists"),
        ]);

        this.lists = await listsHandle.get();
        this.hasValueChanged();
        this.forwardEvent(this.lists, "op", "sequenceDelta");
    }

    public hasValueChanged() {
        if (this.lists !== undefined) {
            this.lists.on("valueChanged", (changed: IDirectoryValueChanged) => {
                console.log("changed", changed);
            });
            return "cool";
        }
    }

    /**
     *
     */
    public getAllLists(): SharedDirectory | undefined {
        return this.lists;
    }

    /**
     *
     * @param listId
     */
    public createList(listId?: string) {
        if (listId !== undefined) {
            return this.lists?.createSubDirectory(listId);
        } else {
            return this.lists?.createSubDirectory(uuid());
        }
    }

    /**
     *
     * @param listId
     */
    public getList(listId: string) {
        return this.lists?.getSubDirectory(listId);
    }

    /**
     *
     * @param listId
     * @param key
     * @param value
     */
    public insertValueInList(listId: string, key: string, value: any) {
        this.lists?.getSubDirectory(listId).set(key, value);
    }

    /**
     *
     * @param listId
     * @param key
     */
    public getKeyValueInList(listId: string, key: string) {
        this.lists?.getSubDirectory(listId).get(key);
    }

    public async request(request: IRequest): Promise<IResponse> {
        return {
            mimeType: "fluid/object",
            status: 200,
            value: this,
        };
    }
}
