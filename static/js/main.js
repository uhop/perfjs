dojo.provide("perfjs.main");

dojo.require("dojo.fx");
dojo.require("dijit.ProgressBar");

dojo.require("perfjs.Runner");
dojo.require("perfjs.Bench");
dojo.require("perfjs.stats");

(function(){
    var d = dojo;

    var WORK_SLICE = 100,   // work slice in ms
        SLEEP_TIME = 20,    // sleep between work slice in ms
        MIN_BENCH  = 20,    // minimal benchmarkable time
        NUM_POINTS = 50,    // default number of data points
        RESAMPLE   = 1000;  // resample size

    function extract(node){
        // collect text
        var text = [];
        d.query(".line", node).forEach(function(line){
            extractText(line, text);
            text.push("\r\n");
        });
        return text.join("");
    }

    function extractText(node, text){
        switch(node.nodeType){
            case 3:
                //if(!whitespace.test(node.nodeValue)){
                    text.push(node.nodeValue);
                //}
                break;
            case 1:
                for(var child = node.firstChild; child; child = child.nextSibling){
                    extractText(child, text);
                }
                break;
        }
    }

    function prepareGist(){
        // retrieve gist
        var text;
        d.query("#container .gist-file pre").some(function(node, index){
            if(gistData.files[index] != "perf.js"){
                return false;
            }
            text = extract(node);
            return true;
        });
        if(!text){
            d.byId("display").innerHTML = "<p class='error'>ERROR: cannot find file named \"perf.js\"</p>";
            d.fx.wipeIn({node: "display"}).play();
            return;
        }
        d.query("#main button").attr("disabled", false).onclick(d.hitch(window, runBenchmark, text));
    }

    dojo.ready(function(){
        if(!gistData){
            gistCallback = prepareGist;
        }else{
            prepareGist();
        }
    });

    var trMap, progress, glob = d.global;

    function wrap(f){
        return function(){
            d.withGlobal(glob, f, f, arguments);
        };
    }

    function runBenchmark(text){
        // create all necessary objects
        var runner = new perfjs.Runner(WORK_SLICE, SLEEP_TIME),
            b = bench = perfjs.Bench(runner, MIN_BENCH, NUM_POINTS);
        b.group("-*calibration*-", new Function);
        b.register(text);
        if(b.groups.length == 1){
            d.query("#main button").attr("disabled", true);
            d.byId("display").innerHTML = "<p class='error'>ERROR: no groups are defined</p>";
            d.fx.wipeIn({node: "display"}).play();
            return;
        }
        // add event handlers
        b.on("testBegin",  wrap(onTestBegin));
        b.on("testEnd",    wrap(onTestEnd));
        b.on("groupBegin", wrap(onGroupBegin));
        b.on("groupEnd",   wrap(onGroupEnd));
        b.on("calBegin",   wrap(onCalBegin));
        b.on("calEnd",     wrap(onCalEnd));
        b.on("unitBegin",  wrap(onUnitBegin));
        b.on("unitEnd",    wrap(onUnitEnd));
        b.on("pointBegin", wrap(onPointBegin));
        b.on("pointEnd",   wrap(onPointEnd));
        // disable the button
        d.query("#main button").attr({
            disabled: true,
            innerHTML: "Running&hellip;"
        });
        // load iframe
        d.create("iframe", {
            src:    "bench.html",
            width:  1,
            height: 1,
            style: {
                visibility: "hidden"
            }
        }, d.body());
    }

    function onTestBegin(test){
        d.style("display", "display", "none");
        var tbody = d.query("#table tbody")[0];
        d.empty(tbody);
        trMap = new Array(test.groups.length);
        for(var i = 1; i < test.groups.length; ++i){
            var name  = test.groups[i],
                units = test.unitDict[name],
                props = {},
                trs   = trMap[i] = [];
            for(var j = 0; j < units.length; ++j){
                var tr = d.create("tr", null, tbody);
                if(!j){
                    d.create("td", {rowSpan: units.length, innerHTML: name}, tr);
                }
                d.create("td", {innerHTML: units[j].name}, tr);
                d.create("td", {colSpan: 5, innerHTML: "<em>not available yet</em>"}, tr);
                trs.push(tr);
            }
        }
        d.style("display", "display", "block");
        if(!progress){
            progress = new dijit.ProgressBar({
                style:   "width: 400px;",
                maximum: NUM_POINTS + 1
            }, "progressBar");
            progress.startup();
        }
    }

    function onTestEnd(test){
        processData(test);
    }

    function onGroupBegin(test, ngroup){
        var name = test.groups[ngroup];
        d.attr("progressMsg", "innerHTML",
            (ngroup ? "Collecting: " + name : "Calibrating") + "&hellip;");
        progress.set("value", 0);
        progress.set("maximum", test.unitDict[name].length * (NUM_POINTS + 1));
    }

    function onGroupEnd(test, ngroup){
    }

    function onCalBegin(test, ngroup, nunit){
        if(ngroup){
            trMap[ngroup][nunit].lastChild.innerHTML = "<strong><em>calibrating&hellip;</em></strong>";
        }
    }

    function onCalEnd(test, ngroup, nunit){
        progress.set("value", progress.get("value") + 1);
    }

    function onUnitBegin(test, ngroup, nunit){
        if(ngroup){
            trMap[ngroup][nunit].lastChild.innerHTML = "<strong><em>collecting&hellip;</em></strong>";
        }
    }

    function onUnitEnd(test, ngroup, nunit){
        if(ngroup){
            trMap[ngroup][nunit].lastChild.innerHTML = "<em>data acquired</em>";
        }
    }

    function onPointBegin(test, ngroup, nunit){
    }

    function onPointEnd(test, ngroup, nunit){
        progress.set("value", progress.get("value") + 1);
    }

    function processData(test){
        var runner = new perfjs.Runner(WORK_SLICE, SLEEP_TIME);
        runner.queue.push(function(){
            trMap = null;
            d.query("#main button").attr({
                disabled:  false,
                innerHTML: "Run Tests"
            });
            d.attr("progressMsg", "innerHTML", "Done");
        });
        for(var i = test.groups.length - 1; i >= 0; --i){
            var name  = test.groups[i],
                units = test.unitDict[name],
                means = new Array(units.length);
            if(i){
                (function(i, means){
                    runner.queue.push(function(){
                        var indices = dojo.map(means, function(x, i){ return i; });
                        indices.sort(function(a, b){ return means[a] < means[b] ? -1 : means[a] > means[b] ? 1 : 0; });
                        for(j = 0; j < means.length; ++j){
                            var tr = trMap[i][j];
                            if(!indices[j]){
                                d.query("td", tr).forEach(function(td){
                                    var rs = d.attr(td, "rowSpan");
                                    if(!rs || rs == 1){
                                        d.addClass(td, "fastest");
                                    }
                                });
                            }
                            tr.lastChild.innerHTML = indices[j] + 1;
                            d.addClass(tr.lastChild, "right");
                        }
                    });
                })(i, means);
                for(var j = units.length - 1; j >= 0; --j){
                    var unit = units[j];
                    (function(i, name, j, unit, means){
                        runner.queue.push(function(){
                            var resampledData = perfjs.stats.resampledDiff(unit, test.unitDict[test.groups[0]][0], RESAMPLE);
                            resampledData.sort();
                            var mean   = means[j] = perfjs.stats.mean(resampledData),
                                median = perfjs.stats.getWeightedValue(resampledData, 0.5),
                                lower  = perfjs.stats.getWeightedValue(resampledData, 0.025),
                                upper  = perfjs.stats.getWeightedValue(resampledData, 0.975),
                                fmt    = perfjs.format.prepareTimeFormat([mean, median, lower, upper, mean - lower, upper - mean]);
                            var tr = trMap[i][j];
                            d.destroy(tr.lastChild);
                            d.create("td", {innerHTML: perfjs.format.formatTime(median, fmt)}, tr);
                            d.create("td", {innerHTML: perfjs.format.formatTime(mean,   fmt)}, tr);
                            d.create("td", {innerHTML: perfjs.format.formatTime(lower,  fmt)}, tr);
                            d.create("td", {innerHTML: perfjs.format.formatTime(upper,  fmt)}, tr);
                            d.create("td", {innerHTML: "<em>wait</em>"}, tr);
                            progress.set("value", progress.get("value") + 1);
                        });
                    })(i, name, j, unit, means);
                }
            }else{
                /*
                runner.queue.push(function(){
                    var resampledData = perfjs.stats.resample(test.unitDict[test.groups[0]][0], RESAMPLE);
                    resampledData.sort();
                });
                */
            }
            (function(i, name){
                runner.queue.push(function(){
                    d.attr("progressMsg", "innerHTML", (i ? "Processing: " + name : "Calibrating") + "&hellip;");
                    progress.set("value", 0);
                    progress.set("maximum", test.unitDict[name].length);
                });
            })(i, name);
        }
        runner.run();
    }
})();