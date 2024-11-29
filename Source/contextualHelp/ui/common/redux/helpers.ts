// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

"use strict";

import * as Redux from "redux";

import {
	MessageMapping,
	MessageType,
	SharedMessages,
	WindowMessages,
} from "../../../messages";
import { CommonActionType, CommonActionTypeMapping } from "./reducers/types";
import { QueueAnotherFunc } from "./reduxUtils";
import { BaseReduxActionPayload, SyncPayload } from "./types";

const AllowedMessages = [
	...Object.values(WindowMessages),
	...Object.values(SharedMessages),
	...Object.values(CommonActionType),
];

export function isAllowedMessage(message: string) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return AllowedMessages.includes(message as any);
}
export function isAllowedAction(action: Redux.AnyAction) {
	return isAllowedMessage(action.type);
}

type ReducerArg = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	queueAction: QueueAnotherFunc<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload?: BaseReduxActionPayload<any>;
};

export function queueIncomingActionWithPayload<
	M extends MessageMapping & CommonActionTypeMapping,
	K extends keyof M,
>(originalReducerArg: ReducerArg, type: K, data: M[K]): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const action = {
		type,
		payload: { data, messageDirection: "incoming" } as any,
	} as any;

	originalReducerArg.queueAction(action);
}

export function queueIncomingAction<
	M extends MessageMapping & CommonActionTypeMapping,
	K extends keyof M,
>(originalReducerArg: ReducerArg, type: K): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	queueIncomingActionWithPayload(originalReducerArg, type as any, undefined);
}

/**
 * Post a message to the extension (via dispatcher actions).
 */
export function postActionToExtension<
	K,
	M extends MessageMapping,
	T extends keyof M = keyof M,
>(originalReducerArg: ReducerArg, message: T, payload?: M[T]): void;
/**
 * Post a message to the extension (via dispatcher actions).
 */
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function postActionToExtension<
	K,
	M extends MessageMapping,
	T extends keyof M = keyof M,
>(originalReducerArg: ReducerArg, message: T, payload?: M[T]): void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postActionToExtension(
	originalReducerArg: ReducerArg,
	message: any,
	payload?: any,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const newPayload: BaseReduxActionPayload<any> = {
		data: payload,
		messageDirection: "outgoing",
		messageType: MessageType.other,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any as BaseReduxActionPayload<any>;

	const action = {
		type: CommonActionType.PostOutgoingMessage,
		payload: { payload: newPayload, type: message },
	};

	originalReducerArg.queueAction(action);
}
export function unwrapPostableAction(action: Redux.AnyAction): {
	type: keyof MessageMapping;

	payload?: BaseReduxActionPayload<{}>;
} {
	// Unwrap the payload that was created in `createPostableAction`.
	const type = action.type;

	const payload: BaseReduxActionPayload<{}> | undefined = action.payload;

	return { type, payload };
}

/**
 * Whether this is a message type that indicates it is part of a scynchronization message.
 */
export function isSyncingMessage(messageType?: MessageType) {
	if (!messageType) {
		return false;
	}

	return (
		(messageType && MessageType.syncAcrossSameNotebooks) ===
			MessageType.syncAcrossSameNotebooks ||
		(messageType && MessageType.syncWithLiveShare) ===
			MessageType.syncWithLiveShare
	);
}

export function reBroadcastMessageIfRequired(
	dispatcher: Function,
	message: WindowMessages | SharedMessages | CommonActionType,
	payload?: BaseReduxActionPayload<{}>,
) {
	const messageType = payload?.messageType || 0;

	if (
		message === WindowMessages.Sync ||
		(messageType && MessageType.syncAcrossSameNotebooks) ===
			MessageType.syncAcrossSameNotebooks ||
		(messageType && MessageType.syncWithLiveShare) ===
			MessageType.syncWithLiveShare ||
		payload?.messageDirection === "outgoing"
	) {
		return;
	}
}
