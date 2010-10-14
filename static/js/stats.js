dojo.provide("perfjs.stats");

perfjs.stats.resample = function(a, n){
    // bootsrap resampling
    var stats = a.stats, reps = a.reps, len = stats.length, t = new Array(n);
    for(var i = 0; i < n; ++i){
        var m = 0;
        for(var j = 0; j < len; ++j){
            m += stats[Math.floor(Math.random() * len)] / len;
        }
        t[i] = m / reps;
    }
    return t;
};

perfjs.stats.resampledDiff = function(a, b, n){
    // bootsrap resampling of difference
    var stats1 = a.stats, reps1 = a.reps, len1 = stats1.length,
        stats2 = b.stats, reps2 = b.reps, len2 = stats2.length,
        t = new Array(n);
    for(var i = 0; i < n; ++i){
        var m1 = 0, m2 = 0;
        for(var j = 0; j < len1; ++j){
            m1 += stats1[Math.floor(Math.random() * len1)] / len1;
        }
        for(j = 0; j < len2; ++j){
            m2 += stats2[Math.floor(Math.random() * len2)] / len2;
        }
        t[i] = m1 / reps1 - m2 / reps2;
    }
    return t;
};

perfjs.stats.resampledMean = function(a, n){
    // bootstrap resampling of mean
    var stats = a.stats, reps = a.reps, len = stats.length, m = 0;
    for(var i = 0; i < n; ++i){
        var t = 0;
        for(var j = 0; j < len; ++j){
            t += stats[Math.floor(Math.random() * len)] / len;
        }
        m += t / reps / n;
    }
    return m;
};

perfjs.stats.resampledMeanDiff = function(a, b, n){
    // bootstrap resampling of mean difference
    var stats1 = a.stats, reps1 = a.reps, len1 = stats1.length,
        stats2 = b.stats, reps2 = b.reps, len2 = stats2.length,
        m = 0, t1, t2, i, j;
    for(i = 0; i < n; ++i){
        t1 = 0;
        for(j = 0; j < len1; ++j){
            t1 += stats1[Math.floor(Math.random() * len1)] / len1;
        }
        t2 = 0;
        for(j = 0; j < len2; ++j){
            t2 += stats2[Math.floor(Math.random() * len2)] / len2;
        }
        m += (t1 / reps1 - t2 / reps2) / n;
    }
    return m;
};

perfjs.stats.alternativeStats = function(a, b, n, threshold){
    // a.length == b.length
    var t = a.concat(b), over = 0, len = a.length;
    // the main loop
    for(var i = 0; i < n; ++i){
        // shuffle the array
        for(var j = t.length - 1; j > 1; --j){
            var k = Math.floor(Math.random() * (j + 1)),
                x = t[k];
            t[k] = t[j];
            t[j] = x;
        }
        // calculate mean
        var m = 0;
        for(j = 0; j < len; ++j){
            m += (t[j] - t[j + len]) / len;
        }
        if(m >= threshold){
            ++over;
        }
    }
    return over;
};

perfjs.stats.mean = function(data){
    // calculating mean
    var len = data.length, m = 0;
    for(var i = 0; i < len; ++i){
        m += data[i] / len;
    }
    return m;
};

perfjs.stats.getPercentile = function(sortedData, value){
    // getting percentile (index) by value
    var lowerIndex = 0, upperIndex = sortedData.length - 1;
    while(lowerIndex < upperIndex){
        var middleIndex = Math.floor((lowerIndex + upperIndex) / 2);
        if(sortedData[middleIndex] < value){
            lowerIndex = middleIndex + 1;
        }else{
            upperIndex = middleIndex;
        }
    }
    return lowerIndex < sortedData.length && value < sortedData[lowerIndex] ?
        lowerIndex : (lowerIndex + 1);
};

perfjs.stats.getWeightedValue = function(sortedData, weight){
    // getting weighted data from a sorted array
    var pos = weight * (sortedData.length - 1),
        upperIndex = Math.ceil(pos),
        lowerIndex = upperIndex - 1;
    if(lowerIndex <= 0){
        // return first element
        return sortedData[0];
    }
    if(upperIndex >= sortedData.length){
        // return last element
        return sortedData[sortedData.length - 1];
    }
    // linear approximation
    return sortedData[lowerIndex] * (upperIndex - pos) + sortedData[upperIndex] * (pos - lowerIndex);
};
