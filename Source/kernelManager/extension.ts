// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { extensions, workspace, type ExtensionContext } from "vscode";

import { CommandHandler } from "./commandHandler";
import { KernelTreeView } from "./kernelTreeView";
import { initializeKnownLanguages } from "./utils";
import { JupyterAPI } from "./vscodeJupyter";

let activated = false;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
	async function activateFeature() {
		if (activated) {
			return;
		}

		activated = true;

		void initializeKnownLanguages();

		const jupyterExt =
			extensions.getExtension<JupyterAPI>("ms-toolsai.jupyter");

		if (!jupyterExt) {
			return;
		}

		await jupyterExt.activate();

		const kernelService = await jupyterExt.exports.getKernelService();

		if (!kernelService) {
			return;
		}

		CommandHandler.register(kernelService, context, jupyterExt.exports);

		KernelTreeView.register(kernelService, context.subscriptions);
	}

	if (workspace.getConfiguration("jupyter").get("kernelManagement.enabled")) {
		await activateFeature();

		return;
	}

	workspace.onDidChangeConfiguration(
		(e) => {
			if (
				e.affectsConfiguration("jupyter") &&
				workspace
					.getConfiguration("jupyter")
					.get("kernelManagement.enabled")
			) {
				activateFeature().catch((ex) =>
					console.error(
						"Failed to activate kernel management feature",
						ex,
					),
				);
			}
		},
		undefined,
		context.subscriptions,
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
