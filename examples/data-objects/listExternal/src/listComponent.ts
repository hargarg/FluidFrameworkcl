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
import { IListEvents } from "./interface"

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const pkg = require("../package.json");
const ListComponentName = pkg.name as string;



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
        ListComponentName,
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

    public getSize() {
        return this.lists?.size
    }

    public hasValueChanged() {
        if (this.lists !== undefined) {
            this.lists.on("valueChanged", (changed: IDirectoryValueChanged) => {
                this.emit(IListEvents.ListValueChanged, changed);
            });

        }
    }
    /**
     *
     */
    public getAllItems<T>(): T {
        const item: any = {};
        const subdirs = this.lists?.subdirectories();
        if (subdirs) {
            for (const [name, subdir] of subdirs) {
                item[name] = {};
                subdir.forEach((val, key_attr) => {
                    item[name][key_attr] = val;
                })
            }
        }
        return item;
    }

    /**
     *
     * @param listId
     */
    public createItem(listId?: string) {
        if (listId !== undefined) {
            this.lists?.createSubDirectory(listId);
            return listId;
        } else {
            const id = uuid();
            this.lists?.createSubDirectory(id);
            return id;
        }
        this.emit(IListEvents.ListCreated, listId);
    }

    /**
     *
     * @param listId
     */
    public getItemDirectory(listId: string) {
        return this.lists?.getSubDirectory(listId);
    }

    /**
     *
     * @param listId
     * @param key
     * @param value
     */
    public insertOrUpdateAttributeInItem<T>(listId: string, key: string, value: T) {
        this.lists?.getSubDirectory(listId).set(key, value);
        this.emit(IListEvents.InsertUpdateListAttribute, listId, key);

    }

    /**
     *
     * @param listId
     * @param key
     */
    public getAttributeInList(listId: string, key: string) {
        this.lists?.getSubDirectory(listId).get(key);
    }

    public deleteItem(listId: string) {
        if (this.lists?.hasSubDirectory(listId)) {
            this.lists?.deleteSubDirectory(listId);
            this.emit(IListEvents.InsertUpdateListAttribute, listId);
        }
    }

    public deleteItemAttribute(listId: string, key: string) {
        this.lists?.getSubDirectory(listId).delete(key);
    }



    public async request(request: IRequest): Promise<IResponse> {
        return {
            mimeType: "fluid/object",
            status: 200,
            value: this,
        };
    }
}
