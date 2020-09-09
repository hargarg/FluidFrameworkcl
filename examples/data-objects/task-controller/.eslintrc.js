/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
    "ignorePatterns": ["src/view/list-view/*.tsx", "src/model/MainController.tsx", "src/service/*.ts", "src/ThirdPartSync/*.ts", "src/utils/**/*.ts"],
    "extends": [
        "@fluidframework/eslint-config-fluid"
    ],
    "rules": {
        "strict": "off",
        "import/no-internal-modules": "off"
    }
}