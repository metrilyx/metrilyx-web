"use strict";


function printAlignmentDebug(args) {
    console.warn(args.name);
    console.warn("curr data:",new Date(args.currStartTime),new Date(args.currEndTime), "dps", args.currDataLength);
    console.warn("new  data:", new Date(args.newStartTime),new Date(args.newEndTime), "dps", args.newDataLength);
    console.warn("window",new Date(args.timeWindow.start), new Date(args.timeWindow.end));
}
/**
 * Get aligned data eliminating duplicates
 *
 * |----- curr data -----|
 *                   |----- new data -----|
 *
 * @param: name         name
 * @param: currData     data in currently display chart
 * @param: newData      data received from backend
 * @param: timeWindow   object current with start and end time window
 *
 * @return: Dataset with current and new data aligned
 *
 * |----- current & new data -----|
 *
 */
function getDataAlignedSeriesForTimeWindow(args) {
    if(args.newData.length <= 0) return false;

    var newStartTime  = args.newData[0][0],
        newEndTime    = args.newData[args.newData.length-1][0],
        currStartTime = args.currData[0][0],
        currEndTime   = args.currData[args.currData.length-1][0];

    /* no new data */
    if(newEndTime <= currEndTime) return false;
    /* check time window */
    if((newStartTime >= args.timeWindow.start) && (newStartTime < args.timeWindow.end)) {
        if ( (newStartTime<currStartTime) && (newEndTime>currStartTime) ) {
            printAlignmentDebug({
                'name': args.name,'timeWindow': args.timeWindow,
                'currStartTime': currStartTime,'currEndTime': currEndTime,'currDataLength': args.currData.length,
                'newStartTime': newStartTime, 'newEndTime': newEndTime, 'newDataLength': args.newData.length
            });
            return false;
        } else if ( (newStartTime>=currStartTime) && (newEndTime>currEndTime) ) {

            while(args.currData.length > 0 && args.currData[args.currData.length-1][0] >= newStartTime)
                args.currData.pop();
            while(args.currData.length > 0 && args.currData[0][0] < args.timeWindow.start)
                args.currData.shift();

            return args.currData.concat(args.newData);
        } else {
            printAlignmentDebug({
                'name': args.name,'timeWindow': args.timeWindow,
                'currStartTime': currStartTime,'currEndTime': currEndTime,'currDataLength': args.currData.length,
                'newStartTime': newStartTime,'newEndTime': newEndTime,'newDataLength': args.newData.length
            });
            return false;
        }
    } else {
        console.warn("Data out of range: ", new Date(args.timeWindow.start), new Date(args.timeWindow.end));
        return false;
    }
}




var DEFAULT_LIBRARY = "highcharts",
    DEFAULT_GRAPH_TYPE = "line";

var PanelType = function(panelType) {
    this.panelType = panelType;
}
PanelType.prototype.isBar = function(v) {
    var c = v ? v : this.panelType;
    return c === "bar";
}
PanelType.prototype.isColumn = function(v) {
    var c = v ? v : this.panelType;
    return c === "column";
}
PanelType.prototype.isPie = function(v) {
    var c = v ? v : this.panelType;
    return c === "pie";
}
PanelType.prototype.isList = function(v) {
    var c = v ? v : this.panelType;
    return c === "list";
}
PanelType.prototype.isText = function(v) {
    var c = v ? v : this.panelType;
    return c === "text";
}

PanelType.prototype.isTimeSeries = function(v) {
    return !( this.isPie(v) || this.isColumn(v) || this.isBar(v) || 
        this.isList(v) || this.isText(v) );
}

PanelType.prototype.isChart = function(v) {
    return !( this.isList(v) || this.isText(v) );
}


var AxisColor = '#666',
    TextColor = '#666',
    FontFamily = "'Helvetica Neue',Helvetica,Arial,sans-serif";

/* === START Highcharts === */
/*
var PieToolTipOptions = {
    tooltip: {
        useHTML: true,
        shared: true,
        shadow: false,
        borderColor: '#666',
        backgroundColor: 'rgba(90,90,90,0.9)',
        formatter: function() {
            var s = '<span style="color:'+this.point.color+'">'+this.point.name+'</span><br/>';
            s += '<table style="margin-top:5px;font-weight:bold;font-size:11px;color:#ddd"><tr><td>'+this.point.y+'</td></tr></table>';
            return s;
        },
        style: {
            color: '#ddd',
            fontSize: '11px'
        }
    }
};
var NonTimeSeriesTooltipOptions = {
    tooltip: {
        useHTML: true,
        shared: true,
        shadow: false,
        borderColor: '#666',
        backgroundColor: 'rgba(90,90,90,0.9)',
        pointFormat: '<div class="text-right"><span style="color:{series.color}">{series.name}:  </span><b>{point.y}</b></div>',
        style: {
            color: '#ddd',
            fontSize: '11px'
        }
    }
};
var LineBasedTooltipOptions = {
    tooltip: {
        borderColor: 'none',
        backgroundColor: 'none',
        animation: false,
        useHTML: true,
        formatter: function() {
            if(this.point) {
                var s = '<div class="chart-tooltip annotation" style="color:#ddd;border-color:'+this.point.series.color+'">';
                s += '<div class="small"><span class="padr5" style="color:'+this.point.series.color+'">'+this.point.title+"</span>"+ (new Date(this.x)).toLocaleString() +'</div>';
                s += "<div style='padding-top:7px;font-size:11px;'>" + this.point.text +"</div></div>";
            } else {
                var s = '<div class="chart-tooltip"><small style="color:#eee">'+ (new Date(this.x)).toLocaleString() +'</small>';
                s += '<table style="font-size:11px;color:#ddd;min-width:220px;margin-top:5px;">';
                var sortedPoints = this.points.sort(function(a, b){
                    return ((a.y > b.y) ? -1 : ((a.y < b.y) ? 1 : 0));
                });
                $.each(sortedPoints , function(i, point) {
                    //&#8226;
                    s += '<tr><td style="color:'+point.series.color+'">'+ point.series.name +'</td>';
                    s += '<td style="text-align:right;padding-left:3px">'+ (point.y).toFixed(2) + '</td></tr>';
                });
                s += '</table></div>';
            }
            return s;
        }
    }
};
*/


var XAxis = { 
    lineColor: AxisColor,
    tickColor: AxisColor,
    startOnTick: false,
    endOnTick: false,
    offset: 10,
    /*tickPixelInterval: 60,*/
    tickInterval: 300000
};

var YAxis = {
    gridLineWidth: 0,
    lineWidth: 1,
    lineColor: AxisColor,
    tickColor: AxisColor,
    opposite: false,
    endOnTick: true,
    tickWidth: 1,
    offset: 10,
    maxPadding: 0,
    minPadding: 0,
};

var LineBasedBasicOptions = {
    tooltip: { 
        crosshairs: [{color: '#bbb'},{color: '#bbb'}],
    },
    yAxis: YAxis,
    xAxis: XAxis,
    rangeSelector: {
        enabled: false
    },
    navigator: {
        enabled: false
    },
    scrollbar: {
        enabled: false
    }
};
/*
var AxisOptions = {
    gridLineWidth: 1,
    gridLineColor: "#ddd",
    minorGridLineColor: '#f8f8f8',
    startOnTick: false,
    endOnTick: false,
    lineColor: '#ccc'
};
*/
var BasicOptions = {
    colors: [
        '#7cb5ec','#90ed7d','#f7a35c', 
        '#E8719E','#f15c80','#91e8e1',
        '#e4d354','#4CE078','#FF8BF2'
    ],
    chart: {
        zoomType: 'xy',
        spacingTop: 10,
        spacingBottom: 0,
        spacingLeft: 10,
        spacingRight: 10,
        backgroundColor: "none",
        style: {
            color: TextColor,
        }
    },
    tooltip: {
        shadow: false,
        shared: false,
        animation: false,
        valueDecimals: 2,
        backgroundColor: 'none',
        borderColor: 'none',
        style: {
            color: TextColor,
            fontSize: '11px'
        },
        positioner: function (labelWidth, labelHeight, point, args) {
            //console.log(this);
            /*var tooltipX, tooltipY;
            if (point.plotX + chart.plotLeft < labelWidth && point.plotY + labelHeight > chart.plotHeight) {
                tooltipX = chart.plotLeft;
                tooltipY = chart.plotTop + chart.plotHeight - 2 * labelHeight - 10;
            } else {
                tooltipX = chart.plotLeft;
                tooltipY = chart.plotTop + chart.plotHeight - labelHeight;
            }
            return {
                x: tooltipX,
                y: tooltipY
            };
            */
            return {
                x: this.chart.chartWidth - ( labelWidth + 10 ), 
                y: 0
            };

        }
    },
    plotOptions: {
        series: {
            marker: {
                enabled: true
            }
        },
        flags: {
            cursor: 'pointer'
        },
        pie: {
            innerSize: '50%',
            allowPointSelect: true,
            dataLabels: {
                color: TextColor,
                enabled: true,
                style: { fontWeight: 'normal' },
                format: '{point.name}<br/>{point.y:.2f} ( {point.percentage:.2f}% )'
            }
        },
        area: {
            fillOpacity: 0.5,
            lineWidth: 1,
            marker:{
                radius:0
            }
        },
        spline: {
            lineWidth: 1,
            marker:{
                radius:0
            }
        },
        column : {
            pointPadding: 0.1,
            borderWidth: 0,
            groupPadding: 0,
            shadow: false
        }
    },
    xAxis: {
        labels: {
            style: { 
                color: TextColor,
                fontSize: '9px',
                fontFamily: FontFamily
            }
        }
    },
    yAxis: {
        labels: {
            style: { 
                color: TextColor,
                fontSize: '9px',
                fontFamily: FontFamily
            }
        }
    },
    title: { text: null },
    legend: {
        itemMarginTop: 1,
        itemMarginBottom: 1,
        enabled: true,
        itemStyle: {
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: "normal",
            color: TextColor
        }
    },
    /*
    legend: {
        align: 'center',
        verticalAlign: 'bottom',
        borderWidth: 0,
        itemDistance: 10,
        maxHeight: 70,
        margin: 5,
        padding: 6,
        navigation: {
            arrowSize: 9,
            style: {
                fontSize: "10px",
                fontWeight: "normal"
            }
        },
    },*/
    credits: { enabled: false }
}

/*
var SupportedGraphTypes = {
    area:
    bar:
    column:
    line:
    pie:
    spline:
    stacked:
};
*/


/*
 * Highcharts annotations / plotlines 
 *      
 *      http://jsfiddle.net/muyhsnd4/
 */



var ChartOptions = function(graphType) {
    this.panelType = new PanelType(graphType);
}
ChartOptions.prototype.pieChartDefaults = function(seriesData, extraOpts) {
    return $.extend(true, {
        chart: {
            type:  'pie'
        },
    }, BasicOptions, {series:seriesData}, extraOpts);
    //}, BasicOptions, PieToolTipOptions, extraOpts);
    
}
ChartOptions.prototype.columnChartDefaults = function(seriesData, extraOpts) {
    return $.extend(true, {
        chart: { 
            type: 'column' 
        },
        xAxis: XAxis,
        yAxis: YAxis,
    }, BasicOptions, seriesData, extraOpts);
}
ChartOptions.prototype.barChartDefaults = function(seriesData, extraOpts) {
    return $.extend(true, {
        chart: { 
            type: 'bar' 
        },
        xAxis: XAxis,
        yAxis: YAxis,
    }, BasicOptions, seriesData, extraOpts);
}
ChartOptions.prototype.lineChartDefaults = function(seriesData, extraOpts) {
    return $.extend(true, {
        chart: { 
            type: 'line' 
        },
    }, BasicOptions, LineBasedBasicOptions, { series: seriesData }, extraOpts);
    //}, BasicOptions, LineBasedTooltipOptions, { series: seriesData }, extraOpts);
}
ChartOptions.prototype.splineChartDefaults = function(seriesData, xtraOpts) {
    return $.extend(true, {
        chart: { 
            type: 'spline' 
        },
    }, BasicOptions, LineBasedBasicOptions, { series: seriesData }, xtraOpts);
    //}, BasicOptions, LineBasedTooltipOptions, { series: seriesData }, xtraOpts);
}
ChartOptions.prototype.areaChartDefaults = function(seriesData, extraOpts) {
    return $.extend(true, {
        chart: { 
            type: 'area' 
        },
    }, BasicOptions, LineBasedBasicOptions, { series: seriesData }, extraOpts);
    //}, BasicOptions, LineBasedTooltipOptions, { series: seriesData }, extraOpts);
}
ChartOptions.prototype.stackedChartDefaults = function(seriesData, xtraOpts) {
    return $.extend(true, {
        plotOptions: { 
            area: { stacking: 'normal' }
        }
    }, this.areaChartDefaults(seriesData, xtraOpts));
}

ChartOptions.prototype.newLineSeries = function(opts) {
    return {
        id: opts.id,
        name: opts.alias,
        data: opts.data, // 2D array
        lineWidth: 1,
    };
}

ChartOptions.prototype.newPieSeries = function(opts) {
    return {
        id: opts.id,
        name: opts.alias,
        y: opts.data, // single value
    };
}
ChartOptions.prototype.newColumnSeries = function(opts) {
    var vals = [], keys = [];
    
    for (var i=0; i < opts.length; i++) {
        vals.push(opts[i].data);
        keys.push(opts[i].alias);
    }
    return {
        xAxis: {
            categories: keys
        },
        series: [{ data: vals }]
    };
}
ChartOptions.prototype.newBarSeries = function(opts) {
    return this.newColumnSeries(opts);    
}
ChartOptions.prototype.newSplineSeries = function(opts) {
    return this.newLineSeries(opts);
}
ChartOptions.prototype.newAreaSeries = function(opts) {
    return this.newLineSeries(opts);
}
ChartOptions.prototype.newStackedSeries = function(opts) {
    return this.newLineSeries(opts);   
}


ChartOptions.prototype.defaultOptions = function(seriesData, xtraOpts) {
    var fSeriesData = []; // holds highcharts formatted series'
    if ( this.panelType.isTimeSeries() ) {
        for (var i=0; i < seriesData.length; i++) {
            fSeriesData.push(this.newLineSeries(seriesData[i]));
        }
    }
        

    switch(this.panelType.panelType) {
        case "pie":
            for(var i=0; i < seriesData.length; i++ ) {
                fSeriesData.push(this.newPieSeries(seriesData[i]))
            }
            return this.pieChartDefaults([{data:fSeriesData}], xtraOpts);
        case "area":
            return this.areaChartDefaults(fSeriesData, xtraOpts);
        case "stacked":
            return this.stackedChartDefaults(fSeriesData, xtraOpts);
        case "spline":
            return this.splineChartDefaults(fSeriesData, xtraOpts);
        case "column":
            return this.columnChartDefaults(this.newColumnSeries(seriesData), xtraOpts);
        case "bar":
            return this.barChartDefaults(this.newColumnSeries(seriesData), xtraOpts);
        default:
            return this.lineChartDefaults(fSeriesData, xtraOpts);
    }
}

ChartOptions.prototype.newSeries = function(data) {
    switch(this.panelType.panelType) {
        case "pie":
            return this.newPieSeries(data);
        case "area":
            return this.newAreaSeries(data);
        case "stacked":
            return this.newStackedSeries(data);
        case "spline":
            return this.newSplineSeries(data);
        case "column":
            return this.newColumnSeries(data);
        case "bar":
            return this.newBarSeries(data);
        default:
            return this.newLineSeries(data);
    }
}

var HighchartGraphProvider = function(selector, panel) {

    this.chartOpts = new ChartOptions(panel.type);

    this.panelType = new PanelType(panel.type);

    this._graphicsOpts = panel.graphics;
    
    this._domElem = $(selector);

    this.chart = null;
    /*
    if ( this.chart !== undefined )  {
        this.chart.destroy();
        this.chart = undefined;
    }
    */
 }

 HighchartGraphProvider.prototype.newChart = function(data) {

    var cOpts = $.extend(true, {}, this.chartOpts.defaultOptions(data, this._graphicsOpts));
    //console.log("Chart options:", cOpts);
    if ( this.panelType.isTimeSeries() ) {
        Highcharts.setOptions({ global: { useUTC: false } });
        Highcharts.seriesTypes.line.prototype.drawPoints = function() {};
        this._domElem.highcharts("StockChart", cOpts);
    } else {
        this._domElem.highcharts(cOpts);
    }
    
    this.chart = $(this._domElem).highcharts();
    
}
HighchartGraphProvider.prototype.destroy = function() {
    if ( this.chart ) {
        console.log('destroying chart');
        this.chart.destroy();
    }
    //console.log('chart', this.chart);
}
HighchartGraphProvider.prototype.reflow = function() {
    this.chart.reflow();
}
/*
  @params:
    newData
    hcSerie: highcharts serie
*/
HighchartGraphProvider.prototype.updateDataForType = function(newData, hcSerie, timeWin) {
    var ndata = false;

    //console.log(newData, hcSerie.options.data);
    switch(this.panelType.panelType) {
        case "bar":
            break;
        case "column":
            break;
        case "pie":
            break;
        default:
            //console.log(timeWin);
            // stacked, line, area
            ndata = getDataAlignedSeriesForTimeWindow({
                name      : hcSerie.options.name, 
                currData  : hcSerie.options.data, 
                newData   : newData.data,
                timeWindow: timeWin
            });
            break;
    }

    if ( ndata ) {
        //console.log("setting for ", hcSerie.options.name);
        hcSerie.setData(ndata, false, null, false);
        return true;
    }
    return false;
}

/*
    This function will be called by MetrilyxGraph to make it library agnostic.

    @params:
        data:
            id:
            type:
            alias:
            data:

        timeFrame: viewing time range
*/
HighchartGraphProvider.prototype.update = function(data, timeFrame) {
    
    //var redraw = false;

    for( var i=0; i < data.length; i++ ) {
        //data[i].type = data[i].type ? data[i].type : DEFAULT_GRAPH_TYPE;
        var serie = this.chart.get(data[i].id);
        if ( serie !== null ) {
            console.log("Working on serie: ", this.chart.userOptions.chart.type, data[i].id);
            this.updateDataForType(data[i], serie, timeFrame);
        } else {
            // upsert series.
            var nSerie = this.chartOpts.newSeries(data[i]);
            this.chart.addSeries(nSerie, false);
        }
    }
    this.chart.redraw();
}
/* === END Highcharts === */



/*
    Generic wrapper to support multiple graphing libraries

    @params:
        panelConfig: metrilyx panel configuration.
        library: graphing library to use (default: highcharts)
*/
var MetrilyxGraph = function (panelConfig, library) {

    this.library = library ? library : DEFAULT_LIBRARY;

    var selector = "[data-graph-id='"+panelConfig.id+"']";

    switch(this.library) {
        case "highcharts":
            this.gProvider = new HighchartGraphProvider(selector, panelConfig);
            break;
        default:
            console.error("Library not supported: ", opts.library);
            break
    }
}
/* 
    Confirm data type matches panel type.  This is because data may be stale while new
    data is being fetched. 

    Params:
        d : An array containing a data field which is also an array. Each element represents
            a single serie.
*/
MetrilyxGraph.prototype.isDataValid = function(d) {
    if ( this.gProvider.panelType.isChart() ) {
        if ( this.gProvider.panelType.isTimeSeries() ) {
            if ( Object.prototype.toString.call(d[0].data) === "[object Array]" ) return true;
            return false;
        } else {
            if ( Object.prototype.toString.call(d[0].data) === "[object Number]" ) return true;
            return false;
        }
    }
    // Shouldn't actually be here as this would only be called in 
    // the case of drawable types. i.e. chart types
    return false;
}
/*

    Params:
        data:
            id:
            type:
            alias:
            data:
        
        timeFrame: viewing timeframe.

*/
MetrilyxGraph.prototype.update = function(data, timeFrame) {
    if ( ! this.isDataValid(data) )  {
        console.log("Invalid data/paneltype:", this.gProvider.panelType.panel, data);
        return;
    }
    if ( this.gProvider.chart == null ) {
        // Create new chart
        this.gProvider.newChart(data);
    } else {
        this.gProvider.update(data, timeFrame);
        //console.error(this.gProvider);
    }
}

/* this is specific to highcharts for now */
MetrilyxGraph.prototype.reflow = function() {
    this.gProvider.reflow();
}

MetrilyxGraph.prototype.destroy = function() {
    this.gProvider.destroy();
}

