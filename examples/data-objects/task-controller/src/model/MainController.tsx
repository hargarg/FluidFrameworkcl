/* eslint eslint-comments/no-unlimited-disable: error */
import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { ListComponent } from "@fluid-example/listexternal";
import { IFluidHTMLView } from "@fluidframework/view-interfaces";
import { IDirectory } from "@fluidframework/map";
import { isWebClient } from "../utils/environment";
import { Planner } from "../ThirdPartSync/Planner";
import { Bridge } from "../ThirdPartSync/Bridge";
import { PlannerConnector } from "./PlannerConnect";

const listComponentKey = "listComponent";
const viewModelKey = "viewModel";
let ListView;
let ReactDOM;
let React;
export class Controller extends DataObject implements IFluidHTMLView {
    public get IFluidHTMLView() {
        return this;
    }

    public dataModel: ListComponent | undefined;
    public viewModel: IDirectory | undefined;
    public planner: any;
    public plannerBridge: any;
    protected async initializingFirstTime() {
        const listComponent = await ListComponent.getFactory().createChildInstance(
            this.context,
        );
        this.root.set(listComponentKey, listComponent.handle);
        this.viewModel = this.root.createSubDirectory(viewModelKey);
    }

    protected async hasInitialized() {
        this.dataModel = await this.root.get<IFluidHandle<ListComponent>>(listComponentKey).get();
        // console.log(this.dataModel);
        // this.dataModel.createListItem("firstList");
        // console.log(this.dataModel.getAllListItems());
        // this.dataModel.insertValueInListItem("firstList", "firstKey", "firstValue");
        if (isWebClient()) {
            ReactDOM = await import("react-dom");
            React = await import("react");
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            ListView = await require("../view").ListView;
        }
    }

    public initiateCallbacks(boardName?: string) {
        console.log("//.............................initializecallback............")
        if (boardName) {
            this.root.set("boardName", boardName);
        }
        this.planner = new Planner(undefined, undefined);
        this.plannerBridge = new Bridge(this.planner, 5000);
        new PlannerConnector(this.dataModel, this.plannerBridge, this.planner, this.root);

    }




    public methodName() {
        console.log("method Name");
    }

    public createList(newData) {
        if (this.dataModel !== undefined) {
            this.dataModel.createListItem(newData)
        }
    }

    render(elm: HTMLElement) {
        if (isWebClient()) {
            ReactDOM.render(<ListView dataModel={this.dataModel} viewModel={this.viewModel} />, elm);
        }
        return elm;
    }
}
