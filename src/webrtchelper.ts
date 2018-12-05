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
export class TextToSpeech {
  _peerConnection: any;
  _uuid: any;
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
    ordered: false, // do not guarantee order
    maxPacketLifeTime: 3000, // in milliseconds
  };


  constructor() {
    this._uuid = this._createUUID();
  }

  init(params: any): Promise<any> {
    if (typeof params === 'object') {
      this._debug(params.debug);
      // TODO set _messaging
      // TODO set peerConnectionConfig()
      // TODO set dataChannelOptions()
      // TODO set _listener
      // TODO set _roomName
    }
  }

  setEventListener(listener: Function | null): void {
    this._listener = listener;
  }

  debug(params: any): boolean {
    if (typeof params === 'boolean')
      this._debug = params;
    return this._debug;
  }

  function start(isCaller): void {
    this._isCaller = isCaller;
    this._listener('webRtcStarting', isCaller);
    this._peerConnection = new RTCPeerConnection(peerConnectionConfig);
    this._peerConnection.onicecandidate = this._gotIceCandidate;

    if (isCaller) {    
      dataChannel = peerConnection.createDataChannel('chat');
      setupDataChannel();    
      peerConnection.createOffer().then(this._createdDescription).catch(this._errorHandler);
    } else {
      // If user is not the offerer let's wait for a data channel
      peerConnection.ondatachannel = event => {
        dataChannel = event.channel;
        setupDataChannel();
      };
    }
  }

  function _errorHandler(error: any): void {
    if (this._debug)
      console.log(error);
    _listener('error', error);
  }

  dataChannel(): any {
    return this._dataChannel;
  }

  function setupDataChannel() {
    dataChannel.onopen = () =>
      this._listener('onDataChanneOpen', this._dataChannel));
    dataChannel.onclose = () =>
      this._listener('onDataChanneClose', this._dataChannel));
    dataChannel.onmessage = event =>
//      insertMessageToDOM(JSON.parse(event.data), false);
      this._listener('onMessage', event));
    dataChannel.onerror = (error) =>
      this._listener('onDataChannelError', error));
  }

  function gotMessageFromServer(message) {
    if (this._debug)
      console.log(message);

    if (!peerConnection)
      this._start(false);

    let signal = message;

    // Ignore messages from ourself
    if(signal.uuid == uuid)
      return;

    if (signal.sdp) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
        // Only create answers in response to offers
        if(signal.sdp.type == 'offer')
          peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
      }).catch(errorHandler);
    } else if(signal.ice)
      peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }

  function gotIceCandidate(event) {
    if (event.candidate != null)
      this._messaging.send({'ice': event.candidate, 'uuid': uuid});
  }

  function createdDescription(description) {
    if (this._debug) {
      console.log('Got description');
      console.log(description)
    }

    peerConnection.setLocalDescription(description).then(function() {
      this._messaging.send({'sdp': peerConnection.localDescription, 'uuid': uuid});
    }).catch(this._errorHandler);
  }

  function _createUUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  function onMessageEvent(err, msg): void {
    if (err)
      return;
    switch (msg.event) {
      case 'message':
        this._listener('messageFromServer', msg.message);
        this._gotMessageFromServer(msg.message);
        break;
      case 'joined':
        if (this._webRtcStarted)
          return;
        const n: number = msg.clients.length;
        if (n >= 3)
          return alert('The room is full');
      
        // First to enter the room is caller
        if (n == 1)
          isCaller = true;
      
        // Wait both peers to join
        if (n !== 2)
          return;

        this._webRtcStarted = true;
        this._start(isCaller);
        break;
    }
  }

  started(): boolean {
    return this._webRtcStarted;
  }
}

export async function createWebRTCHelper(params: any) {
  const webRTCHelper = new WebRTCHelper();
  return await webRTCHelper.init(params || {});
}
