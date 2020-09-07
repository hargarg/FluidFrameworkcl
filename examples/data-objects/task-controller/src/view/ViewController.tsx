import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";
import { IFluidHTMLView } from "@fluidframework/view-interfaces";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { SharedDirectory } from "@fluidframework/map";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { ListView } from "./list-view";

export class ViewController extends DataObject implements IFluidHTMLView {
    protected viewModel: SharedDirectory | undefined;

    public static getFactory() {
        return ViewController.factory;
    }

    private static readonly factory = new DataObjectFactory(
        "ViewController",
        ViewController,
        [SharedDirectory.getFactory()],
        {},
        [],
        true,
    );

    public get IFluidHTMLView() {
        return this;
    }

    protected async initializingFirstTime() {
        const viewModel = SharedDirectory.create(this.runtime);
        this.root.set("viewModel", viewModel.handle);
    }

    protected async hasInitialized() {
        const viewModelhandle = this.root.get<IFluidHandle<SharedDirectory>>(
            "viewModel",
        );
        this.viewModel = await viewModelhandle.get();
    }

    public render(div: HTMLElement) {
        ReactDOM.render(<ListView demoProp="hello" />, div);
        return div;
    }
}
