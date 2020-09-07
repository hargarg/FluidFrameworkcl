/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DataObjectFactory, } from "@fluidframework/aqueduct";
import { SyncedDataObject, setSyncedCounterConfig, useSyncedCounter, setSyncedArrayConfig, useSyncedArray, setSyncedStringConfig, useSyncedString, } from "@fluidframework/react";
import { CollaborativeInput } from "@fluidframework/react-inputs";
import { SharedCounter } from "@fluidframework/counter";
import { SharedObjectSequence, SharedString } from "@fluidframework/sequence";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { getAuthorName } from "./utils";
const defaultImgUrl = "https://picsum.photos/id/221/1200/800";
// ---- Fluid Object w/ a Functional React view using a mixture of DDSes and local state ----
function LikesAndCommentsView(props) {
    var _a;
    // Use synced states
    const [likes, likesReducer] = useSyncedCounter(props.syncedDataObject, "likes");
    const [comments, commentReducer] = useSyncedArray(props.syncedDataObject, "comments");
    const [imgUrl, setImgUrl] = useSyncedString(props.syncedDataObject, "imgUrl");
    // Use local state
    const [currentComment, setCurrentComment] = React.useState("");
    // Convert data to JSX for comments state
    const commentListItems = comments.map((item, key) => (React.createElement("li", { key: key }, `${item.author}: ${item.message}`)));
    // Render
    return (React.createElement("div", null,
        React.createElement("div", null,
            React.createElement("img", { width: '100%', src: (_a = imgUrl) === null || _a === void 0 ? void 0 : _a.getText() }),
            imgUrl !== undefined
                ? React.createElement(CollaborativeInput, { style: { width: "90%" }, sharedString: imgUrl, onInput: (value) => setImgUrl({ value }) })
                : undefined),
        React.createElement("span", null, `Likes: ${likes}`),
        React.createElement("button", { onClick: () => likesReducer.increment(1) }, "+"),
        React.createElement("div", null,
            React.createElement("div", null,
                React.createElement("input", { type: "text", value: currentComment, onChange: (e) => setCurrentComment(e.target.value), placeholder: "Add Comment" }),
                React.createElement("button", { onClick: () => {
                        commentReducer.add({
                            message: currentComment,
                            author: getAuthorName(props.syncedDataObject),
                        });
                        setCurrentComment("");
                    } }, "Submit")),
            React.createElement("ul", null, commentListItems))));
}
/**
 * LikesAndComments example using multiple DDS hooks
 */
export class LikesAndComments extends SyncedDataObject {
    constructor(props) {
        super(props);
        // Declare configs for each synced state the view will need
        setSyncedCounterConfig(this, "likes");
        setSyncedArrayConfig(this, "comments");
        setSyncedStringConfig(this, "imgUrl", defaultImgUrl);
    }
    render(div) {
        ReactDOM.render(React.createElement("div", null,
            React.createElement(LikesAndCommentsView, { syncedDataObject: this })), div);
        return div;
    }
}
// ----- FACTORY SETUP -----
export const LikesAndCommentsInstantiationFactory = new DataObjectFactory("likes-and-comments", LikesAndComments, [
    SharedCounter.getFactory(),
    SharedObjectSequence.getFactory(),
    SharedString.getFactory(),
], {});
export const fluidExport = LikesAndCommentsInstantiationFactory;
//# sourceMappingURL=index.js.map