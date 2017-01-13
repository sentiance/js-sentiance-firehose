var SentianceFirehose = (function () {
  var onDataUpdate;
  var socket;
  var delay = 1000;

  /**
   * Set up a connection to the stream
   * @param {String} appId App identifier
   * @param {String} streamDefinitionId Stream identifier
   * @param {String} bearerToken Authorization token
   * @param {Array<String>} [userIds] List of user id's you want to subscribe on
   */
  var connect = function (appId, streamDefinitionId, bearerToken, userIds) {
    setTimeout(_reconnect(appId, streamDefinitionId, bearerToken, userIds));
  };

  /**
   * Disconnect from the stream
   */
  var disconnect = function () {
    socket.disconnect();
  }

  /**
   * Called on every data update the stream emits
   * @param {Function} callback Custom data handling function
   */
  var onData = function (callback) {
    onDataUpdate = callback;
  };

  /**
   * Reconnect to the stream if parameters are set
   * @param {String} appId App identifier
   * @param {String} streamDefinitionId Stream identifier
   * @param {String} bearerToken Authorization token
   * @param {Array<String>} [userIds] List of user id's you want to subscribe on
   */
  var _reconnect = function (appId, streamDefinitionId, bearerToken, userIds) {
    if (!appId) {
      throw new Error('No app id configured');
    }

    if (!streamDefinitionId) {
      throw new Error('No stream definition id configured');
    }

    if (!bearerToken) {
      throw new Error('No bearer token configured');
    }
    
    if (!onDataUpdate) {
      throw new Error('No data handler configured');
    }

    _createSubscription(appId, streamDefinitionId, bearerToken, userIds);
  };

  /**
   * Schedule reconnect with exponential backoff strategy
   * @param {String} appId App identifier
   * @param {String} streamDefinitionId Stream identifier
   * @param {String} bearerToken Authorization token
   * @param {Array<String>} [userIds] List of user id's you want to subscribe on
   */
  var _scheduleReconnect = function (appId, streamDefinitionId, bearerToken, userIds) {
    delay = delay * 2;

    setTimeout(function () {
      _reconnect(appId, streamDefinitionId, bearerToken, userIds);
    }, delay);
  };

  /**
   * Create a new subscription to the stream
   * Get subscription id and token with GraphQL
   * Initialize stream connection
   * @param {String} appId App identifier
   * @param {String} streamDefinitionId Stream identifier
   * @param {String} bearerToken Authorization token
   * @param {Array<String>} [userIds] List of user id's you want to subscribe on
   */
  var _createSubscription = function (appId, streamDefinitionId, bearerToken, userIds) {
    var http = new XMLHttpRequest();
    var body = {
      query: '\
        mutation($app_id: String!, $stream_definition_id: String!, $user_ids: [String]) {\
          createSubscription(app_id:$app_id, stream_definition_id: $stream_definition_id, user_ids: $user_ids) {\
            id\
            token\
          }\
        }\
      ',
      variables: {
        app_id: appId,
        stream_definition_id: streamDefinitionId,
        user_ids: userIds || null
      }
    };

    http.open('POST', 'https://api.sentiance.com/v2/gql', true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.setRequestHeader('Authorization', 'Bearer ' + bearerToken);
    http.onreadystatechange = function () {
      if (http.readyState === 4) {
        if (http.status === 200) {
          var res = JSON.parse(http.responseText);

          if (res.data && res.data.createSubscription) {
            var id = res.data.createSubscription.id;
            var token = res.data.createSubscription.token;

            _initFirehoseConnection(id, token);
          } else {
            _scheduleReconnect(appId, streamDefinitionId, bearerToken, userIds);
          }
        } else {
          _scheduleReconnect(appId, streamDefinitionId, bearerToken, userIds);
        }
      }
    }
    http.send(JSON.stringify(body));
  };

  /**
   * Set up stream with socket.io
   * Handle stream event listeners
   * @param {String} id Subscription id
   * @param {String} token Subscription token
   */
  var _initFirehoseConnection = function (id, token) {
    socket = io('https://firehose.sentiance.com/');

    socket.on('connect', function () {
      // console.log('Firehose: socket connected');

      _subscribe(socket, id, token);
    });

    socket.on('data', function (jsonMessage) {
      var message = JSON.parse(jsonMessage);

      onDataUpdate(message.data, message.errors, message.metadata);
    });

    socket.on('disconnect', function () {
      // console.info('Firehose: socket disconnected');
    });

    socket.on('error', function (e) {
      // console.warn('Firehose: socket error', e);
    });
  };

  /**
   * Set up subscription to receive events
   * @param {Object} socket socket.io object
   * @param {String} id Subscription id
   * @param {String} token Subscription token
   */
  var _subscribe = function (socket, id, token) {
    var subscription = {
      id: id,
      token: token
    };

    socket.emit('subscribe-v1', subscription);
  };

  return {
    connect: connect,
    disconnect: disconnect,
    onData: onData
  };
})();
