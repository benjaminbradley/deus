var deus = deus || {};
deus.one = (function($, createjs, undefined) {
  "use strict";

  function Pearl(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Pearl.prototype = {
    constructor : Pearl,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/2/ooh.mp3", "ooh");
      
      this.bitmap = new createjs.Bitmap("/plugin/cue/electra/placeholder.svg");
      this.bitmap.scaleX = 0.5;
      this.bitmap.scaleY = 0.5;
      stage.addChild(this.bitmap);

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        that.bitmap.x = 0;
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height - bounds.height + 150) / 2;
      };
      
    },
    draw : function(stage) {
      // noop
    }
  };

  function Shovel(ouroboros) {
    this.bitmap = undefined;
    this.ouroborus = ouroboros;
  }

  Shovel.prototype = {
    constructor : Shovel,
    add : function(stage) {
      //createjs.Sound.registerSound("/plugin/cue/1/ahh.mp3", "aah");
    
      this.bitmap = new createjs.Bitmap("/plugin/cue/electra/placeholder.svg");
      this.bitmap.scaleX = 0.5;
      this.bitmap.scaleY = 0.5;
      stage.addChild(this.bitmap);

      var that = this;
      this.bitmap.image.onload = function() {
        var bounds = that.bitmap.getTransformedBounds();
        window.console.log(bounds);
        that.bitmap.x = stage.canvas.width - bounds.width - 50;
                
        // 150 is the amount from the top, that the stage starts
        that.bitmap.y = (stage.canvas.height - bounds.height + 150) / 2;
      };
      
    },
    draw : function(stage) {
      // noop
    }
  };

  return {
    Shovel : Shovel,
    Pearl : Pearl
  };
})(jQuery, createjs);
