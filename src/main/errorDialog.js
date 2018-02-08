/**
 * Error dialog component
 *
 * An Electron BrowserWindow dialog that presents errors to the user.
 * GPII Application
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid   = require("infusion");
var gpii    = fluid.registerNamespace("gpii");
var ipcMain = require("electron").ipcMain;

require("./utils.js");

/**
 * A component that serves as simple interface for communication with the
 * electron `BrowserWindow` error dialog.
 */
fluid.defaults("gpii.app.errorDialog.channel", {
    gradeNames: ["fluid.component"],

    events: {
        onClosed: null,
        onContentHeightChanged: null
    },

    listeners: {
        "onCreate.registerChannel": {
            funcName: "gpii.app.errorDialog.channel.register",
            args: ["{errorDialog}", "{that}.events"]
        }
    },

    invokers: {
        update: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{dialog}.dialog",
                "onErrorUpdate",
                "{arguments}.0"
            ]
        }
    }
});

/**
 * Register for events from the managed Electron `BrowserWindow` (the renderer process).
 * @param events {Objects} Events that are to be mapped to dialog actoins
 */
gpii.app.errorDialog.channel.register = function (that, events) {
    ipcMain.on("onErrorDialogClosed", function (/*event, message*/) {
        events.onClosed.fire();
    });

    ipcMain.on("onErrorDialogContentSizeChanged", function (event, size) {
        events.onContentHeightChanged.fire(size);
    });
};


/**
 * A component that represent an error dialog
 * and is used to display error messages to the user.
 * In order for an error to be properly displayed it requires the following attributes:
 * title, subheader, details and error code
 */
fluid.defaults("gpii.app.errorDialog", {
    gradeNames: ["gpii.app.dialog"],

    config: {
        attrs: {
            width: 450,
            height: 100 // This is to be changed with respect to the content needs
        },
        fileSuffixPath: "errorDialog/index.html"
    },

    listeners: {
        // close the dialog
        "{dialogChannel}.events.onClosed": {
            changePath: "isShown",
            value: false
        }
    },

    components: {
        dialogChannel: {
            type: "gpii.app.errorDialog.channel",
            options: {
                listeners: {
                    "onContentHeightChanged": {
                        func: "{dialog}.resize",
                        args: ["{arguments}.0.width", "{arguments}.0.height"]
                    }
                }
            }
        }
    },

    invokers: {
        show: {
            funcName: "gpii.app.errorDialog.show",
            args: ["{that}", "{arguments}.0"]
        },
        resize: {
            funcName: "gpii.app.errorDialog.resize",
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    }
});

gpii.app.errorDialog.resize = function (that, windowWidth, windowHeight) {
    that.dialog.setSize(windowWidth, windowHeight);
    that.resetWindowPosition();
};

/**
 * TODO
 * As we're using a single Electron `BrowserWindow`, showing
 * the error requires updating the current message properties.
 *
 * @param that {Component} The `gpii.app.errorDialog` component
 * @param config {Object} Options for error dialog
 * @param config.title {String} The error title
 * @param config.subhead {String} The error's subheader
 * @param config.details {String} The details for the error
 * @param config.code {String} The error code
 */
gpii.app.errorDialog.show = function (that, config) {
    that.dialogChannel.update(config);

    // Give brief time for the window to be resized
    setTimeout(function () {
        // TODO move to listener
        that.applier.change("isShown", true);
    }, 100);
};
