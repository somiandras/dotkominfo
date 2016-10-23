var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  let staticJSON = require('../public/data/test_data.json');
  res.status(200).send(staticJSON);
});

module.exports = router;
