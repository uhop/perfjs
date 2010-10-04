dojo.provide("perfjs.Bench");

dojo.require("perfjs.Runner");

perfjs.Bench = function(runner, limit, points){
    // runner - runner object to run tasks
    // limit  - the lower limit of a test in ms
    // points - number of data points per test

    // utilities

    var empty = {};

    function emit(self, eventName /*...*/){
        var args = Array.prototype.slice.call(arguments, 2),
            listeners = self.listeners[eventName];
        if(listeners){
            for(var i = 0; i < listeners.length; ++i){
                listeners[i].apply(empty, args);
            }
        }
    }

    // benchmark functions

    function runTest(self){
        self.runner.queue.push(function(){ emit(self, "testEnd",  self); });
        for(var i = self.groups.length - 1; i >= 0; --i){
            runGroup(self, i);
        }
        self.runner.queue.push(function(){ emit(self, "testBegin",  self); });
    }

    function runGroup(self, ngroup){
        var units = self.unitDict[self.groups[ngroup]];
        self.runner.queue.push(function(){ emit(self, "groupEnd", self, ngroup); });
        for(var i = units.length - 1; i >= 0; --i){
            benchmarkUnit(self, ngroup, i);
            calibrateUnit(self, ngroup, i);
        }
        self.runner.queue.push(function(){ emit(self, "groupBegin", self, ngroup); });
    }

    function calibrateUnit(self, ngroup, nunit){
        var unit = self.unitDict[self.groups[ngroup]][nunit];
        self.runner.queue.push(function(){
            if(!unit.points && unit.teardown){
                unit.teardown();
            }
            emit(self, "calEnd", self, ngroup, nunit);
        });
        if(unit.points){
            unit.reps = unit.points;
            unit.ms = -1;
        }else{
            self.runner.queue.push(function(){ calibrateUnitOnce(self, ngroup, nunit, 1, 0); });
        }
        self.runner.queue.push(function(){
            emit(self, "calBegin", self, ngroup, nunit);
            if(!unit.points && unit.startup){
                unit.startup();
            }
        });
    }

    function calibrateUnitOnce(self, ngroup, nunit, reps, n){
        var name = self.groups[ngroup],
            unit = self.unitDict[name][nunit],
            ms = benchmark(unit.test, reps);
        if(ms < limit){
            reps = n % 3 == 1 ? 5 * (reps >> 1) : reps << 1;
            self.runner.queue.push(function(){ calibrateUnitOnce(self, ngroup, nunit, reps, n + 1); });
        }else{
            unit.reps = reps;
            unit.ms   = ms;
        }
    }

    function benchmarkUnit(self, ngroup, nunit){
        var unit = self.unitDict[self.groups[ngroup]][nunit];
        self.runner.queue.push(
            function(){
                if(unit.teardown){
                    unit.teardown();
                }
                emit(self, "unitEnd", self, ngroup, nunit);
            }
        );
        for(var i = 0; i < points; ++i){
            self.runner.queue.push(
                function(){ emit(self, "pointEnd", self, ngroup, nunit); },
                function(){ benchmarkUnitOnce(self, ngroup, nunit); },
                function(){ emit(self, "pointBegin", self, ngroup, nunit); }
            );
        }
        self.runner.queue.push(
            function(){
                emit(self, "unitBegin", self, ngroup, nunit);
                if(unit.startup){
                    unit.startup();
                }
            }
        );
    }

    function benchmarkUnitOnce(self, ngroup, nunit){
        var name = self.groups[ngroup],
            unit = self.unitDict[name][nunit];
        emit(self, "pointBegin", self, ngroup, nunit);
        var ms = benchmark(unit.test, unit.reps);
        emit(self, "pointEnd", self, ngroup, nunit);
        unit.stats.push(ms);
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
        var listeners = this.listeners[eventName];
        if(!listeners){
            listeners = this.listeners[eventName] = [];
        }
        listeners.push(handler);
    }

    // public methods

    function clear(){
        this.groups    = [];
        this.unitDict  = {};
        this.includes  = [];
        this.listeners = {};
    }

    function reset(){
        for(var i = 0; i < this.groups; ++i){
            var units = this.unitDict[this.groups[i]];
            for(var j = 0; j < units.length; ++j){
                units[j].stats = [];
            }
        }
    }

    function register(code){
        // summary: register tests
        var f = new Function("", code);
        f.call({
            group:   dojo.hitch(this, group),
            include: dojo.hitch(this, include),
            on:      dojo.hitch(this, on)
        });
        this.reset();
    }

    function writeIncludes(){
        for(var i = 0; i < this.includes.length; ++i){
            var t = this.includes[i];
            document.write(
                t.type.toLowerCase() == "js" ?
                    "<script src='" + t.href + "'></script>" :
                    "<link type='text/css' rel='stylesheet' href='" + t.href + "'>"
            )
        }
    }

    function run(){
        var self = this;
        this.runner.queue.push(function(){ runTest(self); });
        this.reset();
        this.runner.run();
    }

    // make an object

    var item = {
        // properties
        runner:        runner,
        // methods
        clear:         clear,
        reset:         reset,
        register:      register,
        writeIncludes: writeIncludes,
        run:           run,
        // API helpers
        group:         group,
        include:       include,
        on:            on
    };
    item.clear();
    return item;
};