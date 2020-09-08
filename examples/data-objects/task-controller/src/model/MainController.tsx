import * as React from "react";
import * as ReactDOM from "react-dom";
import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { ListComponent } from "@fluid-example/listexternal";
import { IFluidHTMLView } from "@fluidframework/view-interfaces";
import { IDirectory } from "@fluidframework/map";
import { ListView, ViewMethods } from "../view";

const listComponentKey = "listComponent";
const viewModelKey = "viewModel";

export class Controller extends DataObject implements IFluidHTMLView, ViewMethods {
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
        this.dataModel.createList("firstList");
        this.dataModel.insertValueInList("firstList", "firstKey", "firstValue");
    }

    public methodName() {
        console.log("method Name");
    }

    render(elm: HTMLElement, options?: import("@fluidframework/view-interfaces").IFluidHTMLOptions | undefined): void {
        ReactDOM.render(
            <ListView
                dataModel={this.dataModel}
                viewModel={this.viewModel}
                methods={this}/>,
            elm);
    }
}
