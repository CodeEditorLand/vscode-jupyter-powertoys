// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
"use strict";

import {
	Event,
	EventEmitter,
	Uri,
	WebviewView as vscodeWebviewView,
	WebviewOptions,
} from "vscode";

import { disposables } from "../../extension";
import { IWebviewView, IWebviewViewOptions } from "../../types";
import { Webview } from "../webviews/webview";

export class WebviewView extends Webview implements IWebviewView {
	public get visible(): boolean {
		if (!this.webviewHost) {
			return false;
		} else {
			return this.webviewHost.visible;
		}
	}

	public get onDidChangeVisiblity(): Event<void> {
		return this._onDidChangeVisibility.event;
	}

	private readonly _onDidChangeVisibility = new EventEmitter<void>();

	constructor(
		private panelOptions: IWebviewViewOptions,
		additionalRootPaths: Uri[] = [],
	) {
		super(panelOptions, additionalRootPaths);
	}

	protected createWebview(
		_webviewOptions: WebviewOptions,
	): vscodeWebviewView {
		throw new Error("Webview Views must be passed in an initial view");
	}

	protected postLoad(webviewHost: vscodeWebviewView) {
		// Reset when the current panel is closed
		disposables.push(
			webviewHost.onDidDispose(() => {
				this.webviewHost = undefined;

				this.panelOptions.listener.dispose();
			}),
		);

		disposables.push(
			webviewHost.webview.onDidReceiveMessage((message) => {
				// Pass the message onto our listener
				this.panelOptions.listener.onMessage(
					message.type,
					message.payload,
				);
			}),
		);

		disposables.push(
			webviewHost.onDidChangeVisibility(() => {
				this._onDidChangeVisibility.fire();
			}),
		);

		// Fire one inital visibility change once now as we have loaded
		this._onDidChangeVisibility.fire();
	}
}
