import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHTMLView } from "@fluidframework/view-interfaces";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { ListView } from "./list-view";

export class ViewController extends DataObject implements IFluidHTMLView {
    public get IFluidHTMLView() {
        return this;
    }

    protected async initializingFirstTime() {
        
    }

    protected async hasInitialized() {

    }

    public render(div: HTMLElement) {
        ReactDOM.render(
            <ListView 
                demoProp="hello"
            />,
            div
        );
        return div;
    }
}
