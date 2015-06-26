'use strict';

angular.module('datasource.stream', [])
.factory('WebsockMgr', [
    '$rootScope', 'MetrilyxConfig', 
    function($rootScope, MetrilyxConfig) {

        var WebsockMgr = function() {
            var t = this;

            var _sock, 
                _connectState,
                _onopenQueue = [],
                _maxRetries = 5, 
                _retryCount = 0;


            var sendData = function(data) {
                console.log("Sending (websock): ", data);
                _sock.send(angular.toJson(data));
            }

            var setConnectionStatus = function(status) {
                _connectState = status;
                $rootScope.$emit("websocket:connection", { "status": _connectState });
            }

            var onSockClose = function(evt) {
                console.log("Connection closed!");
                setConnectionStatus("disconnected");

                _sock = null;

                if(_retryCount < _maxRetries) {
                    console.log("Reconnecting in 5 sec...")
                    setTimeout(function() { 
                        _initSocket(); 
                        _retryCount++;
                    }, 5000);
                } else {
                    // FIX: This does not work //
                    console.log('Max retries exceeded!');
                    //
                    $rootScope.$emit('notification', {
                        title   :'Websocket max retries exceeded!', 
                        message :'Refresh page to try again.',
                        severity: 'danger'
                    });
                }
            }

            function onSockOpen(evt) {
                console.log("Connected! Extensions: [" + _sock.extensions + "]");
                console.log("Processing queue...", _onopenQueue.length);
                
                // check queue max to avoid server take down.
                while(_onopenQueue.length > 0) sendData(_onopenQueue.shift());

                setConnectionStatus("connected");
            }

            function _sendOrQueueData(data) {
                try {
                    //_sock.send(angular.toJson(data));
                    sendData(data);
                } catch(e) {

                    if(e.code === 11) {
                        _onopenQueue.push(data);
                    } else {
                        //reconnect
                        _onopenQueue.push(data);
                        /* only reconnect if there are no connection actions in progress */
                        if(_connectState === "disconnected") {
                            //console.log("Re-connecting...");
                            _initSocket();
                        } else {
                            console.log("Waiting for connection establishment")
                        }
                    }
                }
            }

            function registerPanel(panel) {
                //console.log('Registering...', panel);
                _sendOrQueueData(panel);
            }

            function onSockMessage(evt) {
                try {
                    var data = JSON.parse(evt.data);
                    if(data.error) {
                        $rootScope.$emit('notification', {
                            severity: 'danger',
                            title: 'Error',
                            message: data.error
                        });
                    } else {
                        //console.log('Emitting:', data);
                        $rootScope.$emit(data['id'], data);
                    }
                } catch(e) {
                    console.log(e);
                }
            }

            function _initSocket() {
                if ( _connectState !== "connected" ) {
                    console.log("Connecting to: ", MetrilyxConfig.websocket)
                    setConnectionStatus("connecting");

                    _sock = new WebSocket(MetrilyxConfig.websocket);
                    
                    _sock.addEventListener('open',    onSockOpen);
                    _sock.addEventListener('close',   onSockClose);
                    _sock.addEventListener('message', onSockMessage);
                }
            }

            var _init = function() {
                
                setConnectionStatus("disconnected");
                
                t.sendData = _sendOrQueueData;
                t.status = _connectState;
                _initSocket();
            }

           _init();
        }
        return (WebsockMgr);
    }
])
.factory('WebsockTransport', ['WebsockMgr', function(WebsockMgr) {

    var _websockMgr = new WebsockMgr();

    return {
        requestData: _websockMgr.sendData,
        connectionStatus: _websockMgr.status
    }
}]);