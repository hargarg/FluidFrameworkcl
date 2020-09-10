/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as readline from "readline";
// import { IFluidObject } from "@fluidframework/core-interfaces";
import { PlannerService } from "@fluid-example/task-controller"

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
async function readlineAsync(input: readline.ReadLine, prompt: string): Promise<string> {
    return new Promise<string>((resolve) => {
        input.question(prompt, (answer) => resolve(answer));
    });
}

/**
 * A simple command line utility to interact with the key-value-cache fluidObject.
 */
export async function launchCLI(fluidObject: any) {
    let x = new PlannerService("a")
    console.log(await x.getMe());
    console.log(new PlannerService("a"))

    console.log("in the launch cli");
    const taskList = fluidObject.dataModel;
    if (taskList === undefined) {
        return;
    }
    console.log("");
    console.log("Begin entering options (ctrl+c to quit)");
    console.log("Type '1' to Create a List");
    console.log("Type '2' to Insert key and Value in list");
    console.log("Type '3' to display all key value in list");
    console.log("");

    const input = readline.createInterface(process.stdin, process.stdout);
    // console.log(taskList.createListItem("awss"));
    // taskList.insertValueInListItem("awss", "firstKey", "firstValue");

    // taskList.on("listChanged", (changed) => { console.log("value is changed:", changed) })
    // taskList.on("createdList", (list) => console.log("list ", list))

    // eslint-disable-next-line no-constant-condition
    while (true) {
        taskList.on("listChanged", (changed) => { console.log("value is changed:", changed) })
        const option = await readlineAsync(input, "Option: ");
        if (option === "1") {
            console.log("");
            const inputKey = await readlineAsync(input, "Enter ListId: ");
            console.log(taskList.createListItem(inputKey));
            console.log("");
        } else if (option === "2") {
            console.log("");
            const listId = await readlineAsync(input, "Enter ListId: ");
            const inputKey = await readlineAsync(input, "Enter Key: ");
            const inputvalue = await readlineAsync(input, "Enter value: ");
            taskList.insertValueInList(listId, inputKey, inputvalue);
            console.log(`${inputKey}: ${taskList.getKeyValueInList(listId, inputKey)}`);
            console.log("");
        } else if (option === "3") {
            console.log("");
            console.log(taskList.getAllListItems());;

        } else {
            console.log("Invalid option");
        }
    }
}
