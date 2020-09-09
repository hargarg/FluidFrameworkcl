/* eslint eslint-comments/no-unlimited-disable: error */

import * as React from "react";
import * as ReactDOM from "react-dom";
import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { ListComponent } from "@fluid-example/listexternal";
import { IFluidHTMLView } from "@fluidframework/view-interfaces";
import { IDirectory } from "@fluidframework/map";
import { ListView, ViewCallbacks } from "../view";

const listComponentKey = "listComponent";
const viewModelKey = "viewModel";

export class Controller extends DataObject implements IFluidHTMLView, ViewCallbacks {
    public get IFluidHTMLView() {
        return this;
    }

    public dataModel: ListComponent | undefined;
    public viewModel: IDirectory | undefined;

    protected async initializingFirstTime() {
        const listComponent = await ListComponent.getFactory().createChildInstance(
            this.context,
        );
        this.root.set(listComponentKey, listComponent.handle);
        this.viewModel = this.root.createSubDirectory(viewModelKey);
    }

    protected async hasInitialized() {
        this.dataModel = await this.root.get<IFluidHandle<ListComponent>>(listComponentKey).get();
        console.log(this.dataModel);
        this.dataModel.createListItem("firstList");
        console.log(this.dataModel.getAllListItems());
        this.dataModel.insertValueInListItem("firstList", "firstKey", "firstValue");
    }

    public methodName() {
        console.log("method Name");
    }

    public createList(newData) {
        if (this.dataModel !== undefined) {
            this.dataModel.createListItem(newData)
        }
    }

    render(elm: HTMLElement, options?: import("@fluidframework/view-interfaces").IFluidHTMLOptions | undefined): void {
        ReactDOM.render(
            <ListView
                dataModel={this.dataModel}
                viewModel={this.viewModel}
                callbacks={this} />,
            elm);
    }
}
