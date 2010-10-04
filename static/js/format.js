dojo.provide("perfjs.format");

(function(){
    var units = ["s", "ms", "&mu;s", "ns", "ps"];

    perfjs.format.prepareTimeFormat = function(data){
        var mx = -1000, mn = 1000;
        for(var i = 0; i < data.length; ++i){
            var p = Math.floor(Math.log(data[i]) / Math.LN10);
            if(mx < p){
                mx = p;
            }
            if(mn > p){
                mn = p;
            }
        }
        var digits = Math.max(mx - mn + 1, 2), scale = 1;
        // TODO: get rid of the loop below
        for(i = 0; mx < 0 && i < units.length - 1; ++i, mx+= 3, scale *= 1000);
        return {scale: scale, precision: digits - mx, unit: units[i]};
    };

    perfjs.format.formatTime = function(val, format){
        return (val * format.scale).toFixed(format.precision).replace(/\.?0+$/, "") + " " + format.unit;
    };

    function putCommasIn(s){
        if(s.length < 4){
            return s;
        }
        var r = s.length % 3;
        return (r ? s.slice(0, r) + "," : "") + s.slice(r).replace(/(\d{3})/g, "$1,").slice(0, -1);
    }

    perfjs.format.formatNumber = function(n){
        return isNaN(n) ? "" : putCommasIn(n.toFixed(0));
    };

    var exp = [0, 0, 0, 0, 3, 3, 6, 6, 6, 9, 9, 9, 12];
    var abbr = "***K**M**B**T";

    function abbrNumber(n, decimals){
        if(isNaN(n)){
            return "";
        }
        decimals = decimals || 0;
        if(n <= 1){
            var t1 = n.toString(), t2 = n.toFixed(decimals);
            return t1.length < t2.length ? t1 : t2;
        }
        var digits = Math.min(Math.floor(Math.log(n) / Math.LN10), exp.length - 1),
            e = exp[digits], s = Math.round(n / Math.pow(10, e - decimals)).toFixed(0);
        return putCommasIn(s.slice(0, -decimals).replace(/\.?0+$/, "") + "." + s.slice(-decimals)) + (e && abbr.charAt(e) || "");
    }
})();