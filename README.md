# js-sentiance-firehose
Javascript module for connecting to the Sentiance Firehose

## Install
Install module using npm:
```bash
npm install js-sentiance-firehose --save
```

Or using bower:
```bash
bower install js-sentiance-firehose --save
```

Include `dist/js-sentiance-firehose.js` or `dist/js-sentiance-firehose.min.js` to your project:
```html
<script src="js-sentiance-firehose.js"></script>
```

## Example
```javascript
// connect to the stream
SentianceFirehose.connect(appId, streamDefinitionId, bearerToken, userIds);

// stream event listener
SentianceFirehose.onData(onDataUpdate);

function onDataUpdate(data, errors, metadata) {
  // implement your custom data handling here
}

// disconnect from the stream
SentianceFirehose.disconnect();
```