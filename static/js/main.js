dojo.provide("perfjs.main");

dojo.require("dijit.ProgressBar");

dojo.require("perfjs.Runner");
dojo.require("perfjs.Bench");
dojo.require("perfjs.stats");

(function(){
    var d = dojo;

    var WORK_SLICE = 100,   // work slice in ms
        SLEEP_TIME = 20,    // sleep between work slice in ms
        MIN_BENCH  = 20,    // minimal benchmarkable time
        NUM_POINTS = 60,    // default number of data points
        RESAMPLE   = 1000,  // resample size
        CONFIDENCE = 0.05;  // confidence level

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
        // show gist
        var t = d.byId("header");
        if(t){
            t.innerHTML = "Gist #" + gist + (gistData.description ? ": " + gistData.description : "");
        }
        t = d.byId("container");
        if(t){
            t.innerHTML = gistData.div;
        }
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
            d.byId("errorMsg").innerHTML = "ERROR: cannot find file named \"perf.js\"";
            d.doc.documentElement.className = "gistError";
            return;
        }
        d.query("#main button").attr("disabled", false).onclick(d.hitch(window, runBenchmark, text));
    }

    function submit(){
        gist = dojo.query("#input input[type=text]").attr("value");
        if(gist){
            d.doc.documentElement.className = "";
            requestGist();
        }
    }

    d.ready(function(){
        gistCallback = prepareGist;
        if(gistData){
            prepareGist();
        }
        submitGist = submit;
        d.query("#input input[type=submit]").attr("disabled", false);
    });

    var trMap, progress, glob = d.global, candleChart, histogramCharts;

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
            d.byId("errorMsg").innerHTML = "ERROR: no groups are defined";
            d.doc.documentElement.className = "gistError";
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
        if(candleChart){
            candleChart.destroy();
            candleChart = null;
        }
        if(histogramCharts){
            d.forEach(histogramCharts, function(chart){
                chart.destroy();
            });
            histogramCharts = null;
        }
        d.empty("charts");
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
        d.attr("progressMsg", "innerHTML", ngroup ? "Collecting: " + name : "Calibrating&hellip;");
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
        // create necessary data structures
        var n = test.groups.length;
        test.stats = new Array(n);
        test.sortedIndices = new Array(n);
        test.indices = new Array(n);
        // generate tasks
        var runner = new perfjs.Runner(WORK_SLICE, SLEEP_TIME);
        runner.queue.push(function(){
            trMap = null;
            d.query("#main button").attr({
                disabled:  false,
                innerHTML: "Run Tests"
            });
            d.attr("progressMsg", "innerHTML", "Done");
        });
        for(var i = n - 1; i > 0; --i){
            taskTestSignificance(runner, test, i);
        }
        runner.queue.push(function(){ showData(test); });
        for(i = n - 1; i > 0; --i){
            taskCalculateRanks(runner, test, i);
            taskCalculateStats(runner, test, i);
        }
        runner.run();
    }

    function taskCalculateStats(runner, test, ngroup){
        var name  = test.groups[ngroup],
            units = test.unitDict[name];
        for(var i = units.length - 1; i >= 0; --i){
            taskCalculateUnitStats(runner, test, ngroup, i);
        }
        runner.queue.push(function(){
            d.attr("progressMsg", "innerHTML", "Processing: " + name);
            progress.set("value", 0);
            progress.set("maximum", units.length);
            test.stats[ngroup] = [];
        });
    }

    function taskCalculateUnitStats(runner, test, ngroup, nunit){
        var name  = test.groups[ngroup],
            units = test.unitDict[name],
            unit  = units[nunit];
        runner.queue.push(function(){
            var resampledData, mean, lower, upper, fmt, tr = trMap[ngroup][nunit];
            if(unit.reps > 0){
                resampledData = perfjs.stats.resampledDiff(unit,
                    test.unitDict[test.groups[0]][0], RESAMPLE);
                resampledData = d.map(resampledData, function(x){ return Math.max(x, 0); }).
                    sort(function(a, b){ return a - b; });
                //TODO: use tilted confidence intervals and criteria
                mean  = perfjs.stats.mean(resampledData);
                lower = perfjs.stats.getWeightedValue(resampledData, CONFIDENCE / 2);
                upper = perfjs.stats.getWeightedValue(resampledData, 1 - CONFIDENCE / 2);
                fmt = perfjs.format.prepareTimeFormat([mean, lower, upper, mean - lower, upper - mean], 1000); // in ms
            }
            d.destroy(tr.lastChild);
            d.create("td", {innerHTML: fmt ? perfjs.format.formatTime(mean,  fmt) : "N/A",
                className: "right"}, tr);
            d.create("td", {innerHTML: fmt ? "-" + perfjs.format.formatTime(mean - lower, fmt) : "N/A",
                className: "right"}, tr);
            d.create("td", {innerHTML: fmt ? "+" + perfjs.format.formatTime(upper - mean, fmt) : "N/A",
                className: "right"}, tr);
            d.create("td", {innerHTML: fmt ? "<em>wait</em>" : "N/A", className: "left"}, tr);
            progress.set("value", progress.get("value") + 1);
            test.stats[ngroup].push(resampledData);
        });
    }

    function taskCalculateRanks(runner, test, ngroup){
        runner.queue.push(function(){
            var stats = test.stats[ngroup],
                means = d.map(stats, function(data){
                    return data && perfjs.stats.mean(data);
                });
            // sort indices
            test.sortedIndices[ngroup] = d.map(means, function(x, i){ return i; }).sort(function(a, b){
                a = means[a];
                b = means[b];
                if(isNaN(a)){
                    return isNaN(b) ? 0 : 1;
                }
                if(isNaN(b)){
                    return -1;
                }
                return a - b;
            });
            // build the reverse map
            var ind = test.indices[ngroup] = new Array(test.sortedIndices[ngroup].length);
            d.map(test.sortedIndices[ngroup], function(x, i){
                ind[x] = i;
            });
            // update the table
            for(j = 0; j < means.length; ++j){
                var tr = trMap[ngroup][j];
                if(!ind[j]){
                    d.query("td", tr).forEach(function(td){
                        var rs = d.attr(td, "rowSpan");
                        if(!rs || rs == 1){
                            d.addClass(td, "fastest");
                        }
                    });
                }
                if(!isNaN(means[j])){
                    tr.lastChild.innerHTML = ind[j] + 1;
                }
            }
        });
    }

    function taskTestSignificance(runner, test, ngroup){
        var name  = test.groups[ngroup],
            units = test.unitDict[name];
        for(var i = units.length - 2; i >= 0; --i){
            for(var j = units.length - 1; j > i; --j){
                taskTestPairs(runner, test, ngroup, i, j);
            }
        }
        runner.queue.push(function(){
            d.attr("progressMsg", "innerHTML", "Significance testing: " + name);
            progress.set("value", 0);
            progress.set("maximum", units.length * (units.length - 1) / 2);
        });
    }

    function taskTestPairs(runner, test, ngroup, nunit1, nunit2){
        runner.queue.push(function(){
            var name = test.groups[ngroup], units = test.unitDict[name],
                unit1 = units[nunit1], unit2 = units[nunit2], count;
            if(unit1.reps > 0 && unit2.reps > 0){
                count = perfjs.stats.alternativeStats(unit1, unit2, RESAMPLE,
                    perfjs.stats.mean(test.stats[ngroup][nunit1]) - perfjs.stats.mean(test.stats[ngroup][nunit2]));
                if((Math.min(count, RESAMPLE - count) + 1) / (RESAMPLE + 1) > CONFIDENCE / 2){
                    // significance test failed
                    var td1 = trMap[ngroup][nunit1].lastChild, td2 = trMap[ngroup][nunit2].lastChild,
                        txt1 = td1.innerHTML, txt2 = td2.innerHTML;
                    if(txt1.slice(-1) == ")"){
                        txt1 = txt1.slice(0, -1) + ", ";
                    }else{
                        txt1 += " (ST failed: ";
                    }
                    td1.innerHTML = txt1 + units[nunit2].name + ")";
                    if(txt2.slice(-1) == ")"){
                        txt2 = txt2.slice(0, -1) + ", ";
                    }else{
                        txt2 += " (ST failed: ";
                    }
                    td2.innerHTML = txt2 + units[nunit1].name + ")";
                }
            }
            progress.set("value", progress.get("value") + 1);
        });
    }

    function showData(test){
        dojo["require"]("dojox.charting.Chart2D");
        dojo["require"]("dojox.charting.themes.Julie");
        dojo.ready(function(){
            // prepare data for charting
            var labels = [{value: 0, text: ""}], candles = [];
            for(var i = 1; i < test.stats.length; ++i){
                var data = test.stats[i], name = test.groups[i], units = test.unitDict[name];
                for(var j = 0; j < data.length; ++j){
                    var unit = units[j], runName = name + " - " + unit.name;
                    labels.push({value: labels.length, text: runName});
                    candles.push( data[j] ? {
                        low:   perfjs.stats.getWeightedValue(data[j], CONFIDENCE / 2),
                        open:  perfjs.stats.getWeightedValue(data[j], 0.250),
                        mid:   perfjs.stats.getWeightedValue(data[j], 0.500),
                        close: perfjs.stats.getWeightedValue(data[j], 0.750),
                        high:  perfjs.stats.getWeightedValue(data[j], 1 - CONFIDENCE / 2)
                    } : null);
                }
            }
            labels.push({value: labels.length, text: ""});
            // create charts
            var div = d.create("div", {style: {width: "400px", height: "400px"}}, "charts");
            candleChart = new dojox.charting.Chart2D(div, {margins: {l: 0, r: 0, t: 20, b: 10}}).
                setTheme(dojox.charting.themes.Julie).
                addAxis("x", {natural: true, labels: labels, htmlLabels: false, rotation: -20,
                    min: 0.5, max: candles.length + 0.5}).
                addAxis("y", {vertical: true, fixLower: "major", fixUpper: "minor", htmlLabels: false}).
                addPlot("default", {type: "Candlesticks", gap: 2}).
                addSeries("Boxplot", candles).
                render();
        });
        /*
        histogramCharts = [];
        for(var i = 1; i < test.stats.length; ++i){
            var data = test.stats[i], name = test.groups[i], units = test.unitDict[name],
                mn = Math.min.apply(Math, d.map(data, function(d){ return d[0]; })),
                mx = Math.max.apply(Math, d.map(data, function(d, i, unit){ return d[unit.length - 1]; }));
            div = d.create("div", {style: {width: "400px", height: "200px"}}, "charts");
            var chart = new dojox.charting.Chart2D(div).
                setTheme(dojox.charting.themes.Julie).
                addAxis("x", {fixLower: "major", fixUpper: "major"}).
                addAxis("y", {vertical: true, fixUpper: "minor", includeZero: true, natural: true}).
                addPlot("default", {type: "Columns"});
            for(j = 0; j < data.length; ++j){
                var bins = new Array(20), prevIndex = 0;
                for(var k = 0; k < bins.length; ++k){
                    var u = (mx - mn) / bins.length * (k + 1),
                        nextIndex = perfjs.stats.getPercentile(data[j], u);
                    bins[k] = nextIndex - prevIndex;
                    prevIndex = nextIndex;
                }
                chart.addSeries(units[j].name, bins);
            }
            chart.render();
            histogramCharts.push(chart);
        }
        */
    }
})();
