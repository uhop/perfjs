function bench(delay, limit, points){
    // delay - pause between tests in ms
    // limit - the lower limit of a test in ms
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
        var args = Array.prototype.slice(1);
        for(var i = 0; i < listeners.length; ++i){
            listeners[i].apply(empty, args);
        }
    }

    function runner(tasks){
        while(tasks.length){
            var task = tasks.pop();
            if(task(tasks)){
                setTimeout(function(){
                    runner(tasks);
                }, delay);
                break;
            }
        }
    }

    // benchmark functions

    function runGroups(tasks, self){
        for(var i = self.groups.length - 1; i >= 0; --i){
            (function(i){
                tasks.push(
                    function(){ emit(self.groupEndListeners, self, i); },
                    function(tasks){ runGroup(tasks, self, i); },
                    function(){ emit(self.groupStartListeners, self, i); }
                );
            })(i);
        }
    }

    function runGroup(tasks, self, ngroup){
        tasks.push(
            function(tasks){ runUnits(tasks, self, ngroup); },
            function(){ finalizeCalibration(self, ngroup); },
            function(tasks){ calibrateUnits(tasks, self, ngroup); }
        );
    }


    function calibrateUnits(tasks, self, ngroup){
        var units = self.unitDict[self.groups[ngroup]];
        self.calibrations = [];
        for(var i = units.length - 1; i >= 0; --i){
            (function(i){
                tasks.push(function(tasks){ calibrateUnit(tasks, self, ngroup, i); });
            })(i);
        }
    }

    function calibrateUnit(tasks, self, ngroup, nunit){
        var unit = self.unitDict[self.groups[ngroup]][nunit];
        tasks.push(function(){
            if(unit.teardown){
                unit.teardown();
            }
            emit(self.calEndListeners, self, ngroup, nunit);
        });
        tasks.push(function(tasks){ calibrateOnce(tasks, self, ngroup, nunit, 1); });
        tasks.push(function(){
            emit(self.calStartListeners, self, ngroup, nunit);
            if(unit.startup){
                unit.startup();
            }
        });
    }

    function calibrateOnce(tasks, self, ngroup, nunit, reps){
        var unit = self.unitDict[self.groups[ngroup]][nunit];
        var ms = benchmark(unit.test, reps);
        if(ms < limit){
            tasks.push(function(tasks){ calibrateOnce(tasks, self, ngroup, nunit, reps << 1); });
        }else{
            self.calibrations.push({reps: reps, ms: ms});
        }
        return true;
    }

    function finalizeCalibration(self, ngroup){
        var p = 0;
        for(var i = 1; i < self.calibrations.length; ++i){
            if(self.calibrations[p].reps < self.calibrations[i].reps){
                p = i;
            }
        }
        var name = self.groups[ngroup];
        self.repsDict[name] = self.calibrations[p];
        self.estimate = delay * (self.calibrations.length - 1);
        for(i = 0; i < self.calibrations.length; ++i){
            var t = self.calibrations[i];
            self.estimate += t.ms / t.reps * self.reps;
        }
        delete self.calibrations;
    }

    function runUnits(tasks, self, ngroup){
        var units = self.unitDict[self.groups[ngroup]];
        for(var i = units.length - 1; i >= 0; --i){
            var unit = self.unitDict[self.groups[ngroup]][i];
            (function(i){
                tasks.push(function(){
                    if(unit.teardown){
                        unit.teardown();
                    }
                    emit(self.unitEndListeners, self, ngroup, i);
                });
                tasks.push(function(){ correctTime(self, ngroup); });
                for(var j = 0; j < points; ++j){
                    tasks.push(function(){ runUnit(self, ngroup, i); });
                }
                tasks.push(function(){
                    emit(self.unitStartListeners, self, ngroup, i);
                    if(unit.startup){
                        unit.startup();
                    }
                });
            })(i);
        }
    }

    function runUnit(self, ngroup, nunit){
        var name = self.groups[ngroup],
            unit = self.unitDict[name][nunit];
        var ms = benchmark(unit.test, self.repsDict[name]);
        if(self.statDict[name]){
            self.statDict[name].push(ms);
        }else{
            self.statDict[name] = [ms];
        }
        return true;
    }

    function correctTime(self, ngroup){
        var name = self.groups[ngroup],
            reps = self.repsDict[name],
            ms = benchmark(nothing, reps),
            stats = self.statDict[name];
        for(var i = 0; i < stats.length; ++i){
            stats[i] = Math.max(stats[i] - ms, 0);
        }
        return true;
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
        if(!name){
            name = "Group #" + (this.groups.length + 1);
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
        this.testStartListeners  = [];
        this.testEndListeners    = [];
        this.groupStartListeners = [];
        this.groupEndListeners   = [];
        this.unitStartListeners  = [];
        this.unitEndListeners    = [];
        this.calStartListeners   = [];
        this.calEndListeners     = [];
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
        var self = this, tasks = [
            function(){ emit(self.testEndListeners,  self); },
            function(tasks){ runGroups(tasks, self); },
            function(){ emit(self.testStartListeners,  self); }
        ];
        runner(tasks);
    }

    // make an object

    var item = {
        // methods
        clear:    clear,
        register: register,
        run:      run
    };
    clear.call(item);
    return item;
}
