/**
 * @license
 * Copyright 2018 OOMWOO LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
export declare class WebRTCHelper {
    _peerConnection: any;
    _dataChannel: any;
    _webRtcStarted: boolean;
    _roomName: string;
    _listener: Function | null;
    _isCaller: boolean;
    _debug: boolean;
    _uuid: string;
    static _messaging: any;
    _peerConnectionConfig: any;
    _dataChannelOptions: any;
    constructor();
    init(params: any): Promise<any>;
    setEventListener(listener: Function | null): void;
    debug(params: any): boolean;
    _issueEvent(event: any): void;
    _start(isCaller: boolean): void;
    _errorHandler(error: any): void;
    dataChannel(): any;
    _setupDataChannel(): void;
    _gotMessageFromServer(message: any): void;
    _gotIceCandidate(event: any): void;
    _createdDescription(description: any): void;
    _createUUID(): string;
    _onMessageEvent(err: any, msg: any): void;
    started(): boolean;
}
export declare function createWebRTCHelper(params: any): Promise<any>;
