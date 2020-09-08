import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";
import { IFluidHTMLView } from "@fluidframework/view-interfaces";
// import * as ReactDOM from "react-dom";
// import * as React from "react";
import { SharedDirectory } from "@fluidframework/map";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { ListComponent } from "@fluid-example/listexternal";
import { ViewControllerType } from "../componentTypes";
// import { ListView } from "./list-view";

const viewModelKey = "viewModel";
const dataModelKey = "dataModel";

export interface ViewProps {
    model: {
        viewModel: SharedDirectory | undefined;
        dataModel: ListComponent | undefined;
    }
}

export class ViewController extends DataObject implements IFluidHTMLView {
    protected viewModel: SharedDirectory | undefined;
    protected dataModel: ListComponent | undefined;

    public static getFactory() {
        return ViewController.factory;
    }

    private static readonly factory = new DataObjectFactory(
        ViewControllerType,
        ViewController,
        [SharedDirectory.getFactory()],
        {},
        [],
        true,
    );

    public get IFluidHTMLView() {
        return this;
    }

    protected async initializingFirstTime(initialState: any) {
        const viewModel = SharedDirectory.create(this.runtime);
        this.root.set(viewModelKey, viewModel.handle);
        this.root.set(dataModelKey, initialState.modelHandle);
    }

    protected async hasInitialized() {
        const viewModelhandle = this.root.get<IFluidHandle<SharedDirectory>>(viewModelKey);
        this.viewModel = await viewModelhandle.get();
        const dataModel = this.root.get<IFluidHandle<ListComponent>>(dataModelKey);
        this.dataModel = await dataModel.get();
    }

    public render(div: HTMLElement) {
        // const model = {
        //     viewModel: this.viewModel,
        //     dataModel: this.dataModel,
        // };
        // ReactDOM.render(<ListView model={model} />, div);
        return div;
    }
}

export const getViewControllerPromise = async (): Promise<any> => Promise.resolve(ViewController);
