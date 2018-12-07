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
export class WebRTCHelper {
  _peerConnection: any;
  _dataChannel: any;
  _webRtcStarted: boolean = false;
  _roomName: string = 'WebRTCHelper';
  _listener: Function | null = null;
  _isCaller: boolean = false;
  _debug: boolean = false;
  _uuid: string = '';
  static _messaging: any;
  _peerConnectionConfig: any = {
    'iceServers': [
      {'urls': 'stun:stun.stunprotocol.org:3478'},
      {'urls': 'stun:stun.l.google.com:19302'},
    ]
  };
  _dataChannelOptions: any = {
    // ordered: false, // do not guarantee order
    // maxPacketLifeTime: 3000, // in milliseconds
  };

  constructor() {
    this._uuid = this._createUUID();
  }

  init(params: any): Promise<any> {
    params = params || {};
    this.debug(params.debug);
    this.messaging(params.messaging);
    this.peerConnectionConfig(params.peerConnectionConfig);
    this.dataChannelOptions(params.dataChannelOptions);
    this.eventListener(params.eventListener);
    this.room(params.room);

    // TODO resolve/reject promise
    return this._makePromise();
  }  
  
  debug(params: any): boolean {
    if (typeof params === 'boolean')
      this._debug = params;
    return this._debug;
  }

  _issueEvent(event: any) {
    if (this._debug)
      console.log('_issueEvent(event) ' + JSON.stringify(event));
    if (this._listener)
      this._listener(event.err, event);
  }
  
  _start(isCaller: boolean): void {
    this._isCaller = isCaller;
    this._issueEvent({ event: 'webRtcStarting', caller: isCaller, room: this._roomName});
    this._peerConnection = new RTCPeerConnection(this._peerConnectionConfig);
    this._peerConnection.onicecandidate = this._gotIceCandidate;

    if (isCaller) {
      let label = this._dataChannelOptions.label || this._roomName;
      this._dataChannel = this._peerConnection.createDataChannel(label, this._dataChannelOptions);
      this._setupDataChannel();    
      this._peerConnection.createOffer().then(this._createdDescription).catch(this._errorHandler);
    } else {
      // If user is not the offerer let's wait for a data channel
      this._peerConnection.ondatachannel = (event: any) => {
        this._dataChannel = event.channel;
        this._setupDataChannel();
      };
    }
  }

  _errorHandler(error: any): void {
    if (this._debug)
      console.log(error);
    this._issueEvent({'err': error});
  }

  dataChannel(): any {
    return this._dataChannel;
  }

  _setupDataChannel(): void {
    this._dataChannel.onopen = () =>
      this._issueEvent({ event: 'dataChanneOpen', dataChannel: this._dataChannel, err: false });
    this._dataChannel.onclose = () =>
      this._issueEvent({ event: 'dataChanneClose', dataChannel: this._dataChannel, err: false });
    this._dataChannel.onmessage = (event: any) =>
      this._issueEvent({ event: 'message', data: event, err: false });
    this._dataChannel.onerror = (error: any) =>
      this._issueEvent({ event: 'dataChannelError', err: error });
  }

  _gotMessageFromServer(message: any): void {
    if (this._debug)
      console.log(message);

    if (!this._peerConnection)
      this._start(false);

    let signal = message;

    // Ignore messages from ourself
    if(signal.uuid == this._uuid)
      return;

    if (signal.sdp) {
      this._peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function(x: any) {
        // Only create answers in response to offers
        if (signal.sdp.type == 'offer') {
          let pc: any = x._peerConnection;
          pc.createAnswer().then(() => x._createdDescription()).catch(x._errorHandler());
        }
      }).catch(this._errorHandler);
    } else if(signal.ice)
      this._peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(this._errorHandler);
  }

  _gotIceCandidate(event: any) {
    if (event.candidate != null)
      WebRTCHelper._messaging.send({'ice': event.candidate, 'uuid': this._uuid});
  }

  _send(message: any) {
  }

  _createdDescription(description: any) {
    if (this._debug) {
      console.log('Got description');
      console.log(description)
    }
    this._peerConnection.setLocalDescription(description).then(function(x: any) {
      x._messaging.send({'sdp': x._peerConnection.localDescription, 'uuid': x._uuid});
    }).catch(this._errorHandler);
  }

  _createUUID(): string {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  _onMessageEvent(err: any, msg: any): void {
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
        const n: number = msg.clients.length;
        if (n >= 3)
          return alert('The room is full');
      
        // First to enter the room is caller
        let caller: boolean = false;
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

  started(): boolean {
    return this._webRtcStarted;
  }

  eventListener(listener: Function | null): any {
    let result = this._listener;
    if (listener !== undefined)
      this._listener = listener;
    return result;
  }

  dataChannelOptions(options: any): any {
    let result = this._dataChannelOptions;
    if (options !== undefined)
      this._dataChannelOptions = options;
    return result;
  }

  peerConnectionConfig(config: any): any {
    let result = this._peerConnectionConfig;
    if (config !== undefined)
      this._peerConnectionConfig = config;
    return result;
  }

  messaging(m: any): any {
    let result = WebRTCHelper._messaging;
    if (m !== undefined)
      WebRTCHelper._messaging = m;
    return result;
  }

  room(roomName: any): any {
    let result = this._roomName;
    if (roomName !== undefined)
      this._roomName = roomName;
    return result;
  }

  close() {
    this.messaging(null);
    this.peerConnectionConfig(null);
    this.dataChannelOptions(null);
    this.eventListener(null);
  }
}

export async function createWebRTCHelper(params: any) {
  const webRTCHelper = new WebRTCHelper();
  return await webRTCHelper.init(params || {});
}
