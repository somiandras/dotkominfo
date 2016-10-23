var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');

router.get('/', function(req, res, next) {
  makeRequest();

  function makeRequest(options, iterations, counter, data, max) {
    options = options || {
      url: 'https://api.stocktwits.com/api/2/streams/trending.json'
    };
    counter = counter || 0;
    iterations = iterations || 3;
    data = data || [];
    if (max) {
      options.qs = {
        max: max
      };
    }
    console.log('Iterations: ' + iterations);
    request.get(options, function(error, resp, body) {
      if (error) next(error);
      let b = JSON.parse(body);
      if (b.response.status === 429) next('Rate limit exceeded...');
      data = data.concat(b.messages);
      if (counter < iterations) {
        counter += 1;
        makeRequest(options, iterations, counter, data, b.cursor.max);
      } else {
        fs.writeFile('test_data.json', JSON.stringify(data, null, 2), function(err) {
          if (err) console.log(err);
          console.log('File ready');
          res.status(200).send(data);
        });
      }
    });
  }
});

module.exports = router;
