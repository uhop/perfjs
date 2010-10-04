dojo.provide("perfjs.Runner");

perfjs.Runner = function(work, sleep, stopped){
    // work    - allowed work slice in ms
    // sleep   - pause between tests in ms
    // stopped - initial flag to stop runner
    this.work  = work;
    this.sleep = sleep;
    this.stop  = stopped;
};

perfjs.Runner.prototype = {
    run: function(){
        var self = this, task, sliceStart = new Date().getTime(), sliceFinish;
        while(this.queue.length && !this.stop){
            task = this.queue.pop();
            task(this);
            sliceFinish = new Date().getTime();
            if(sliceFinish - sliceStart >= this.work){
                setTimeout(function(){
                    self.run();
                }, this.sleep);
                break;
            }
        }
    }
};
