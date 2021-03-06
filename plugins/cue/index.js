var execSync = require('exec-sync');

function cue(name, deps) {
  var events = require('../../models/events')(deps.io);
  var tree = require('../../models/tree')(deps.io);
  var shows = require('../../models/shows')(deps.io);
  var initialized = false;
  var nextCue = 0;
  var cueNumber = "0";
  
  var findLeaf = function(cueNumber, branches) {
    var i;
    if (!branches) {
      return;
    }
    for(i = 0; i < branches.length; i++) {
      var leaf = branches[i];
      if (leaf.id == cueNumber) {
        return leaf;
      }
      if (leaf.nodes && leaf.nodes.length > 0) {
        var leaf = findLeaf(cueNumber, leaf.nodes);
        if (leaf) {
          return leaf;
        }
      }
    }
    return undefined;
  };
  
  var emitStatusMessage = function(toggle, cueNumber, go, event, leaf) {
        deps.io.sockets.emit('cue.status', {
          'enabled': toggle,
          'cue': cueNumber,
          'go': go,          
          'view': event,
          'screen': leaf.screen
        });
  };
  
  var findEvent = function(toggle, cueNumber, go, leaf) {
      if (!leaf) {
        return;
      }
    
    
      events.findBy('all', {key: [leaf.cue], reduce:false}, function(err, event) {
        
        if (event) {
          event.nextcues = leaf.nodes;
          
          if (go === 'vote') {
            event.state = 'on';
            events.save(undefined, event, function() {
              console.log("Turned voting on for " + event._id);
              emitStatusMessage(toggle, cueNumber, go, event, leaf);
            });
            return;
          }
          if (go === 'novote') {
            event.state = 'off';
            events.save(undefined, event, function() {
              console.log("Turned voting off for " + event._id);
              emitStatusMessage(toggle, cueNumber, go, event, leaf);
            });
            return;            
          }
        }
        emitStatusMessage(toggle, cueNumber, go, event, leaf);
      });
    
  };
  
  var markComplete = function(cueNumber) {
    
    shows.findCurrent(function(err, show) {
      if (err || !show) {
        console.log("No current show found:" + err);
        return;
      }
      if(show.cues && show.cues.indexOf(cueNumber) === -1) {
        show.cues.push(String(cueNumber));
        shows.save(undefined, show, function(err, show) {
        });
      }
    });
  }
  
  var markWinner = function(cueNumber, cmd) {
    
    shows.findCurrent(function(err, show) {
      if (err || !show) {
        console.log("No current show found:" + err);
        return;
      }
      show.winners[cueNumber] = cmd;
      shows.save(undefined, show, function(err, show) {
      });
    });
  };
  
  var setCue = function(cueNumber) {
    
    shows.findCurrent(function(err, show) {
      if (err || !show) {
        console.log("No current show found:" + err);
        return;
      }
      
      if(show.cues.indexOf(cueNumber) === -1) {
        // add this cue to the end
        show.cues.push(String(cueNumber));
      } else {
        var cueIndex = show.cues.indexOf(cueNumber);
        var newCues = show.cues.slice(0, cueIndex + 1);
        show.cues = newCues;
      }
      shows.save(undefined, show, function(err, show) {
      });
    });
  };
  
  deps.io.sockets.on('connection', function(socket) {
    var toggle = false;
    var emitStatus = function(deps, go) {
      // TODO: Allow changing the template
      tree.list(null, function(err, branches) {
        if (go == 'go') {
          cueNumber = nextCue;
          nextCue = undefined;
          console.log("\n\nCueNumber: " + cueNumber + "; nextCue: " + nextCue);
        }
        markComplete(cueNumber);
        
        var leaf = findLeaf(cueNumber, branches);
        var event = findEvent(toggle, cueNumber, go, leaf);
        if (leaf && leaf.nodes && leaf.nodes.length == 1) {
          nextCue = leaf.nodes[0].id;
        }
      });
    };
    
    var init = function() {
      if (initialized) {
        emitStatus(deps);
        return;
      }
      initialized = true;
      shows.findCurrent(function(err, show) {
        if (!show) {
          return;
        }
        var cues = show.cues;
        if (cues && cues.length > 0) {
          cueNumber = cues[cues.length - 1];
        }
        emitStatus(deps);
      });
    };
    init();
    
    socket.on('/cue/reset', function(cmd) {
      var _name;
      console.log("cue reset", cmd);
      toggle = false;
      cueNumber = "0";
      emitStatus(deps);
    });
    socket.on('/cue/toggle', function(cmd) {
      var _name;
      console.log("cue toggle", cmd);
      toggle = !toggle;
      //            deps.io.sockets.emit('/message', "Toggling cue mode: " + (toggle ? 'enabled' : 'disabled'));
      emitStatus(deps);
    });
    socket.on('/cue/go', function(cmd) {
      var _name;      
      console.log("cue go", cmd);
      emitStatus(deps, 'go');
    });
    socket.on('/cue/set', function(cmd) {
      console.log("cue set", cmd);
      nextCue = cmd.cue;
      setCue(String(cmd.cue));
      if (!cmd.go) {
        cmd.go = 'go';
      }
      else if (cmd.go == 'vote' && cueNumber != cmd.cue) {
        //deps.io.sockets.emit('clearOlympus');
        // jump to the cue
        cueNumber = String(cmd.cue);
      }
      
//       if (cmd.go == 'go') {
//         deps.io.sockets.emit('clearOlympus');
//       }
      
      emitStatus(deps, cmd.go);
    });
    socket.on('/cue/manual', function(cmd) {
      events.findBy('all', {key: [cmd.event_id], reduce:false}, function(err, event) {
        deps.io.sockets.emit('cue.status', {
          'enabled': true,
          'cue': -1,
          'go': 'go',          
          'view': event,
          'screen': cmd.screen
        });
      });
    });
    
    socket.on('/cue/vote', function(cmd) {
      console.log("cue vote", cmd);
      emitStatus(deps, 'vote');
    });
    
    socket.on('/cue/novote', function(cmd) {
      console.log("cue vote", cmd);
      emitStatus(deps, 'novote');
    });
    
    socket.on('/cue/winner', function(cmd) {
      console.log("Winner" + cueNumber);
      nextCue = cmd.cue;
      markWinner(cueNumber, cmd);
      // save this to the results and set the next cue, but don't go
      //deps.io.sockets.emit('/cue/winner', cmd);
    });
    socket.on('/cue/sim', function(cmd) {
      execSync(__dirname + '/../../scripts/load.sh +15128724637 4 250');
      console.log("Done with load");
    });
  });
}
module.exports = cue;