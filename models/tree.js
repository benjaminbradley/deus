var config = require('../config'),
  _und = require('underscore'),
  getDb = function(cookie) {
    var params = {};
    if(cookie) {
      params.url = config.couchdb.url;
      params.cookie = 'AuthSession=' + cookie;
    } else {
      params.url = config.couchdb.secureUrl;
    }
    return require('nano')(params);
  },
  findBy = exports.findBy = function(view, params, callback) {
    var tree;
    getDb().view('event', view, params, function(err, body) {
      if(err) {
        console.log(err);
        callback(err, null);
      } else {
        if(body.rows.length == 0) {
          var msg = 'No match for: ' + view + ', ' + JSON.stringify(params);
          console.log(msg);
          callback(msg, null);
        } else {
          tree = body.rows[0].value;
          if(body.rows.length > 1) {
            for(var i = 0; i < body.rows.length; i++) {
              if(body.rows[i].value.state != 'off') {
                event = body.rows[i].value;
              }
            }
          }
          //eventsCache[view+JSON.stringify(params)] = event;
          callback(null, tree);
        }
      }
    });
    //}
  }, save = exports.save = function(cookie, tree, callback) {
    if(!tree._id) {
      tree._id = 'tree:' + tree.id;
    }
    if(!tree.type) {
      tree.type = 'tree'
    }
    getDb(cookie).insert(tree, function(err, body) {
      callback(err, body);
    });
  }, destroy = exports.destroy = function(cookie, id, rev, callback) {
    getDb(cookie).destroy(id, rev, function(err, body) {
      callback(err, body);
    });
  }, list = exports.list = function(cookie, callback) {
    getDb(cookie).view('event', 'tree', function(err, body) {
      if(err) {
        console.log(err);
        callback(err);
      } else {
        var trees = _und.map(body.rows, function(row) {
          return row.value
        });
        callback(null, trees);
      }
    });
  },
  io;
module.exports = function(socketio) {
  io = socketio;
  return exports;
};