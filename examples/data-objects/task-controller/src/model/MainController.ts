import { DataObject } from "@fluidframework/aqueduct";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { ListComponent } from "@fluid-example/listexternal";
// import { ViewController } from "../view";

const listComponentKey = "listComponent";

export class MainController extends DataObject {
    private listComponent: ListComponent | undefined;

    protected async initializingFirstTime() {
        const viewController = await ListComponent.getFactory().createChildInstance(
            this.context,
        );
        this.root.set(listComponentKey, viewController.handle);
    }

    protected async hasInitialized() {
        //  eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.root.get<IFluidHandle<ListComponent>>(listComponentKey).get()
            .then((result) => {
               this.listComponent = result;
               console.log(this.listComponent);
            });
    }
}
