'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
class WebRTCHelper {
    constructor() {
        this._webRtcStarted = false;
        this._roomName = 'WebRTCHelper';
        this._listener = null;
        this._isCaller = false;
        this._debug = false;
        this._uuid = '';
        this._peerConnectionConfig = {
            'iceServers': [
                { 'urls': 'stun:stun.stunprotocol.org:3478' },
                { 'urls': 'stun:stun.l.google.com:19302' },
            ]
        };
        this._dataChannelOptions = {
            ordered: false,
            maxPacketLifeTime: 3000,
        };
        this._uuid = this._createUUID();
    }
    init(params) {
        if (typeof params === 'object') {
            this.debug(params.debug);
            // TODO set _messaging
            // TODO set peerConnectionConfig()
            // TODO set dataChannelOptions()
            // TODO set _listener
            // TODO set _roomName
        }
        return Promise.resolve(this);
    }
    setEventListener(listener) {
        this._listener = listener;
    }
    debug(params) {
        if (typeof params === 'boolean')
            this._debug = params;
        return this._debug;
    }
    _issueEvent(event) {
        if (this._debug)
            console.log('_issueEvent(event) ' + JSON.stringify(event));
        if (this._listener)
            this._listener(event.err, event);
    }
    _start(isCaller) {
        this._isCaller = isCaller;
        this._issueEvent({ event: 'webRtcStarting', caller: isCaller, room: this._roomName });
        this._peerConnection = new RTCPeerConnection(this._peerConnectionConfig);
        this._peerConnection.onicecandidate = this._gotIceCandidate;
        if (isCaller) {
            this._dataChannel = this._peerConnection.createDataChannel(this._roomName);
            this._setupDataChannel();
            this._peerConnection.createOffer().then(this._createdDescription).catch(this._errorHandler);
        }
        else {
            // If user is not the offerer let's wait for a data channel
            this._peerConnection.ondatachannel = (event) => {
                this._dataChannel = event.channel;
                this._setupDataChannel();
            };
        }
    }
    _errorHandler(error) {
        if (this._debug)
            console.log(error);
        this._issueEvent({ 'err': error });
    }
    dataChannel() {
        return this._dataChannel;
    }
    _setupDataChannel() {
        this._dataChannel.onopen = () => this._issueEvent({ event: 'dataChanneOpen', dataChannel: this._dataChannel, err: false });
        this._dataChannel.onclose = () => this._issueEvent({ event: 'dataChanneClose', dataChannel: this._dataChannel, err: false });
        this._dataChannel.onmessage = (event) => this._issueEvent({ event: 'message', data: event, err: false });
        this._dataChannel.onerror = (error) => this._issueEvent({ event: 'dataChannelError', err: error });
    }
    _gotMessageFromServer(message) {
        if (this._debug)
            console.log(message);
        if (!this._peerConnection)
            this._start(false);
        let signal = message;
        // Ignore messages from ourself
        if (signal.uuid == this._uuid)
            return;
        if (signal.sdp) {
            this._peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function (x) {
                // Only create answers in response to offers
                if (signal.sdp.type == 'offer') {
                    let pc = x._peerConnection;
                    pc.createAnswer().then(() => x._createdDescription()).catch(x._errorHandler());
                }
            }).catch(this._errorHandler);
        }
        else if (signal.ice)
            this._peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(this._errorHandler);
    }
    _gotIceCandidate(event) {
        if (event.candidate != null)
            WebRTCHelper._messaging.send({ 'ice': event.candidate, 'uuid': this._uuid });
    }
    _createdDescription(description) {
        if (this._debug) {
            console.log('Got description');
            console.log(description);
        }
        this._peerConnection.setLocalDescription(description).then(function (x) {
            x._messaging.send({ 'sdp': x._peerConnection.localDescription, 'uuid': x._uuid });
        }).catch(this._errorHandler);
    }
    _createUUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    _onMessageEvent(err, msg) {
        if (err)
            return;
        switch (msg.event) {
            case 'message':
                this._issueEvent({ event: 'messageFromServer', message: msg.message });
                this._gotMessageFromServer(msg.message);
                break;
            case 'joined':
                if (this._webRtcStarted)
                    return;
                const n = msg.clients.length;
                if (n >= 3)
                    return alert('The room is full');
                // First to enter the room is caller
                let caller = false;
                if (n == 1)
                    caller = true;
                // Wait both peers to join
                if (n !== 2)
                    return;
                this._webRtcStarted = true;
                this._start(caller);
                break;
        }
    }
    started() {
        return this._webRtcStarted;
    }
}
async function createWebRTCHelper(params) {
    const webRTCHelper = new WebRTCHelper();
    return await webRTCHelper.init(params || {});
}

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

exports.WebRTCHelper = WebRTCHelper;
exports.createWebRTCHelper = createWebRTCHelper;
