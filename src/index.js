var SentianceFirehose = (function () {
  var connect = function (appId, streamDefinitionId, bearerToken, userIds) {
    _createSubscription(appId, streamDefinitionId, bearerToken, userIds);
  };

  var onData = function (callback) {
    _onDataUpdate = callback;
    this._onDataUpdate = callback;
  };

  var _onDataUpdate;

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
    }

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
            console.error('Could not create subscription', { app_id: appId, stream_definition_id: streamDefinitionId, bearer_token: bearerToken });
          }
        } else {
          console.error('Received incorrect HTTP status', http.statusText);
        }
      }
    }
    http.send(JSON.stringify(body));
  };

  var _initFirehoseConnection = function (id, token) {
    var socket = io('https://firehose.sentiance.com/');

    socket.on('connect', function () {
      console.log('connected');

      _subscribe(socket, id, token);
    });

    socket.on('data', function (jsonMessage) {
      var message = JSON.parse(jsonMessage);

      _onDataUpdate(message.data, message.errors, message.metadata);
    });

    socket.on('disconnect', function () {
      console.log('disconnected');
    });

    socket.on('error', function (e) {
      console.log(e);
    });
  };

  var _subscribe = function (socket, id, token) {
    var subscription = {
      id: id,
      token: token
    };

    socket.emit('subscribe-v1', subscription);
  };

  return {
    connect: connect,
    onData: onData
  };
})();
