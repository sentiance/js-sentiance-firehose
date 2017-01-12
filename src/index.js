var SentianceFirehose = (function () {
  var connect = function (appId, streamDefinitionId, bearerToken, config) {
    createSubscription(appId, streamDefinitionId, bearerToken);
  };

  var createSubscription = function (appId, streamDefinitionId, bearerToken) {
    var http = new XMLHttpRequest();
    var body = {
      query: '\
        mutation($app_id: String!, $stream_definition_id: String!) {\
          createSubscription(app_id:$app_id, stream_definition_id: $stream_definition_id) {\
            id\
            token\
          }\
        }\
      ',
      variables: {
        app_id: appId,
        stream_definition_id: streamDefinitionId
      }
    }

    http.open('POST', 'https://api.sentiance.com/v2/gql', true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.setRequestHeader('Authorization', 'Bearer ' + bearerToken);
    http.onreadystatechange = function () {
      if (http.readyState === 4 && http.status === 200) {
        var res = JSON.parse(http.responseText);
        var id = res.data.createSubscription.id;
        var token = res.data.createSubscription.token;

        initFirehoseConnection(id, token);
      }
    }
    http.send(JSON.stringify(body));
  };

  return {
    connect: connect
  };
})();
