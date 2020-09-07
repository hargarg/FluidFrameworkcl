/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export function getAuthorName(syncedDataObject) {
    var _a, _b, _c;
    const quorum = syncedDataObject.dataProps.runtime.getQuorum();
    const clientId = (_a = syncedDataObject.dataProps.runtime.clientId, (_a !== null && _a !== void 0 ? _a : ""));
    return _c = ((_b = quorum.getMember(clientId)) === null || _b === void 0 ? void 0 : _b.client.user).name, (_c !== null && _c !== void 0 ? _c : "");
}
//# sourceMappingURL=utils.js.map