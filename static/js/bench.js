function Runner(work, sleep){
    this.work  = work;
    this.sleep = sleep;
    this.queue = Array.prototype.slice.call(arguments, 2);
}

Runner.prototype = {
    run: function(){
        var self = this, task, sliceStart = new Date().getTime(), sliceFinish;
        while(this.queue.length){
            var task = this.queue.pop();
            task(this);
            sliceFinish = new Date().getTime();
            if(sliceFinish - sliceStart >= this.work){
                setTimeout(function(){
                    self.run();
                }, this.sleep);
                break;
            }
        }
    },
    add: function(task /*...*/){
        this.queue.push.apply(this.queue, arguments);
    }
};

function bench(work, sleep, limit, points){
    // work   - allowed work slice in ms
    // sleep  - pause between tests in ms
    // limit  - the lower limit of a test in ms
    // points - number of data points per test

    // utilities

    var nothing = new Function(), empty = {};

    function bind(fn, obj){
        if(Object.prototype.toString.call(fn) == "[object Function]"){
            return function(){
                return fn.apply(obj, arguments);
            };
        }
        return function(){
            return obj[fn].apply(obj, arguments);
        }
    }

    function emit(listeners /*...*/){
        var args = Array.prototype.slice.call(arguments, 1);
        for(var i = 0; i < listeners.length; ++i){
            listeners[i].apply(empty, args);
        }
    }

    // benchmark functions

    function runTest(runner, self){
        runner.add(function(){ emit(self.testEndListeners,  self); });
        for(var i = self.groups.length - 1; i >= 0; --i){
            runGroup(runner, self, i);
        }
        runner.add(function(){ emit(self.testBeginListeners,  self); });
    }

    function runGroup(runner, self, ngroup){
        var units = self.unitDict[self.groups[ngroup]];
        runner.add(function(){ emit(self.groupEndListeners, self, ngroup); });
        for(var i = units.length - 1; i >= 0; --i){
            benchmarkUnit(runner, self, ngroup, i);
            calibrateUnit(runner, self, ngroup, i);
        }
        runner.add(function(){ emit(self.groupBeginListeners, self, ngroup); });
    }

    function calibrateUnit(runner, self, ngroup, nunit){
        var unit = self.unitDict[self.groups[ngroup]][nunit];
        runner.add(function(){
            if(unit.teardown){
                unit.teardown();
            }
            emit(self.calEndListeners, self, ngroup, nunit);
        });
        runner.add(function(){ calibrateUnitOnce(runner, self, ngroup, nunit, 1, 0); });
        runner.add(function(){
            emit(self.calBeginListeners, self, ngroup, nunit);
            if(unit.startup){
                unit.startup();
            }
        });
    }

    function calibrateUnitOnce(runner, self, ngroup, nunit, reps, n){
        var name = self.groups[ngroup],
            unit = self.unitDict[name][nunit],
            ms = benchmark(unit.test, reps);
        if(ms < limit){
            reps = n % 3 == 1 ? 5 * (reps >> 1) : reps << 1;
            runner.add(function(runner){ calibrateUnitOnce(runner, self, ngroup, nunit, reps, n + 1); });
        }else{
            var val = {reps: reps, ms: ms};
            if(self.repsDict[name]){
                self.repsDict[name].push(val);
            }else{
                self.repsDict[name] = [val];
            }
        }
    }

    function benchmarkUnit(runner, self, ngroup, nunit){
        var unit = self.unitDict[self.groups[ngroup]][nunit];
        runner.add(
            function(){
                if(unit.teardown){
                    unit.teardown();
                }
                emit(self.unitEndListeners, self, ngroup, nunit);
            }
        );
        for(var i = 0; i < points; ++i){
            runner.add(
                function(){ emit(self.pointEndListeners, self, ngroup, nunit); },
                function(){ benchmarkUnitOnce(self, ngroup, nunit); },
                function(){ emit(self.pointBeginListeners, self, ngroup, nunit); }
            );
        }
        runner.add(
            function(){
                emit(self.unitBeginListeners, self, ngroup, nunit);
                if(unit.startup){
                    unit.startup();
                }
            }
        );
    }

    function benchmarkUnitOnce(self, ngroup, nunit){
        var name = self.groups[ngroup],
            unit = self.unitDict[name][nunit];
        emit(self.pointBeginListeners, self, ngroup, nunit);
        var ms = benchmark(unit.test, self.repsDict[name][nunit].reps);
        emit(self.pointEndListeners, self, ngroup, nunit);
        var stats = self.statDict[name];
        if(!stats){
            stats = self.statDict[name] = [];
        }
        if(stats.length <= nunit){
            stats.push([ms]);
        }else{
            stats[nunit].push(ms);
        }
    }

    function benchmark(fn, reps){
        // summary: benchmarks a function
        // fn - function
        // reps - number of repetitions
        // returns total time in ms
        var start = new Date();
        for(var i = 0; i < reps; ++i){
            fn();
        }
        var end = new Date();
        return end.getTime() - start.getTime();
    }

    // API functions

    function group(groupName /*...*/){
        var name = groupName, i = 1, units = [];
        if(Object.prototype.toString.call(name) != "[object String]"){
            name = "Group #" + this.groups.length;
            i = 0;
        }
        for(; i < arguments.length; ++i){
            var fn = arguments[i], t;
            if(Object.prototype.toString.call(fn) == "[object Function]"){
                // solitary function
                t = {test: fn};
            }else{
                // full object
                t = fn;
            }
            if(!t.name){
                if(t.test.name){
                    t.name = t.test.name;
                }else{
                    var r = /^\s*function\s+([^\s\(]+)/.exec(t.test.toString());
                    if(r && r[1]){
                        t.name = r[1];
                    }else{
                        t.name = "Test #" + (units.length + 1);
                    }
                }
            }
            units.push(t);
        }
        if(units.length){
            if(this.unitDict.hasOwnProperty(name)){
                this.unitDict[name] = this.unitDict[name].concat(units);
            }else{
                this.groups.push(name);
                this.unitDict[name] = units;
            }
        }
    }

    function include(href, type){
        this.includes.push({
            href: href,
            type: type || (/\.js$/.test(href.toLowerCase()) ? "js" : "css")
        });
    }

    function on(eventName, handler){
        var listeners = this[eventName + "Listeners"];
        if(listeners){
            listeners.push(handler);
        }
    }

    // public methods

    function clear(){
        // reset globals
        this.groups   = [];
        this.unitDict = {};
        this.statDict = {};
        this.repsDict = {};
        this.includes = [];
        // reset event listeners
        this.testBeginListeners  = [];
        this.testEndListeners    = [];
        this.groupBeginListeners = [];
        this.groupEndListeners   = [];
        this.calBeginListeners   = [];
        this.calEndListeners     = [];
        this.unitBeginListeners  = [];
        this.unitEndListeners    = [];
        this.pointBeginListeners = [];
        this.pointEndListeners   = [];
    }

    function register(code){
        // summary: register tests
        var f = new Function("", code);
        f.call({
            group:   bind(group, this),
            include: bind(include, this),
            on:      bind(on, this)
        });
        // insert includes
        for(var i = 0; i < this.includes.length; ++i){
            var t = this.includes[i];
            document.write(
                t.type.toLowerCase() == "js" ?
                    "<script type='text/javascript' src='" + t.href + "'></script>" :
                    "<link type='text/css' rel='stylesheet' href='" + t.href + "'>"
            )
        }
    }

    function run(){
        var self = this, runner = new Runner(
            work, sleep,
            function(runner){ runTest(runner, self); }
        );
        runner.run();
    }

    // make an object

    var item = {
        // methods
        clear:    clear,
        register: register,
        run:      run,
        // API helpers
        group:    group,
        include:  include,
        on:       on
    };
    clear.call(item);
    return item;
}
