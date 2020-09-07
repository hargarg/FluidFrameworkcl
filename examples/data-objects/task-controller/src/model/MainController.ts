import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { ListComponent } from "@fluid-example/listexternal";
import { IFluidHTMLView } from "@fluidframework/view-interfaces";
import { ViewController } from "../view";

const listComponentKey = "listComponent";
const viewControllerKey = "viewController";

export class MainController extends DataObject implements IFluidHTMLView {
    public get IFluidHTMLView() {
        return this;
    }
    private listComponent: ListComponent | undefined;
    private viewController: ViewController | undefined;

    protected async initializingFirstTime() {
        const listComponent = await ListComponent.getFactory().createChildInstance(
            this.context,
        );
        this.root.set(listComponentKey, listComponent.handle);
        const viewComponent = await ViewController.getFactory().createChildInstance(this.context,
            { modelHandle: listComponent.handle });
        this.root.set(viewControllerKey, viewComponent.handle);
    }

    protected async hasInitialized() {
        this.listComponent = await this.root.get<IFluidHandle<ListComponent>>(listComponentKey).get();
        console.log(this.listComponent);
        this.listComponent.createList("firstList");
        this.listComponent.insertValueInList("firstList", "firstKey", "firstValue");
        this.viewController = await this.root.get<IFluidHandle<ViewController>>(viewControllerKey).get();
        console.log(this.viewController);
    }

    render(elm: HTMLElement, options?: import("@fluidframework/view-interfaces").IFluidHTMLOptions | undefined): void {
        this.viewController?.render(elm);
    }
}
