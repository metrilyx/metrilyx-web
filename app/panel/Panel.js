'use strict';

// Maximum string length for any error
var MAX_ERROR_LEN = 200;

angular.module('metrilyx.panel', [])
.directive('panelContainer', ['$rootScope', '$routeParams', function($rootScope, $routeParams) {
    /*
        Overall panel container.  Consists of content as well as controls
    */
    return {
        restrict: 'E',
        scope: {
            graph: '=',
            panels: '=',
            dashboardId: '=',
            podIndex: '=',
            rowIndex: '=',
            columnIndex: '=',
            panelIndex: '=',
            isATemplate: '&'
        },
        templateUrl: 'app/panel/panel.html',
        link: function(scope, elem, attrs) {
            
            var _tmpCopy;

            var refreshView = function() {
                $rootScope.$broadcast('panel:refresh:'+scope.graph.id, 
                                                { id: scope.graph.id });
                scope.panelStatus = {
                    status: 'Refreshing...',
                    severity: 'info'
                };
            }

            var toggleVisibility = function() {
                scope.controlsVisible = !scope.controlsVisible;
            }

            var onPanelStatusUpdate = function(e, d) {
                scope.panelStatus = d;
            }
            
            var onCopyClick = function(evt) {
                //console.log(evt);
                scope.$apply(function() {
                    scope.graph.datasources = scope.graph.datasources.concat(_tmpCopy);
                    
                    scope.selectedConfig = 'datasources';
                    // show controls on copy
                    scope.controlsVisible = true;
                    //
                });
                
                $rootScope.$broadcast("copy:complete", {});
            }
            /*
            var onCopyHoverOver = function(evt) {
                elem.addClass('copy-hover');
            }

            var onCopyHoverOut = function(evt) {
                elem.removeClass('copy-hover');
            }
            */
            var onCopyInitiated = function(e, d) {
                if ( d.type == 'datasource' ) {
                    _tmpCopy = d.list;
                    // to avoid registering the initial click
                    setTimeout(function() {
                        elem.click(onCopyClick);
                        //elem.mouseover(onCopyHoverOver);
                        //elem.mouseout(onCopyHoverOut);
                    }, 500);
                
                }
            }

            var onCopyComplete = function(e, d) {
                elem.unbind('click', onCopyClick);
                //elem.unbind('mouseover', onCopyHoverOver);
                //elem.unbind('mouseout', onCopyHoverOut);
                _tmpCopy = undefined;
            }
            
            var initDatasources = function() {
                var datasources = scope.graph.datasources;
                for(var i=0; i<datasources.length;i++) {
                    datasources[i].$selected = false;
                }
            }
            var init = function() {
                scope.selectedConfig = "datasources";
                
                initDatasources();

                scope.controlsVisible = $routeParams.pageId == 'new' ? true:false;
                
                scope.panelStatus = "ok";
                
                scope.refreshView = refreshView;

                scope.$on("copy:initiate", onCopyInitiated);
                scope.$on("copy:complete", onCopyComplete);
                
                scope.$on("panel:status:update:"+scope.graph.id, onPanelStatusUpdate);

            }

            init();
        }
    }
}])
.directive('panelControls', ['$rootScope', 'MetrilyxConfig', 'Schema',
    function($rootScope, MetrilyxConfig, Schema) {
        return {
            restrict: 'E',
            templateUrl: 'app/panel/controls.html',
            link: function(scope, elem, attrs) {

                var dsDragDropConfig = {
                    cursor: 'move',
                    connectWith: '.datasource-list',
                    handle: '.ds-mv-handle',
                };

                var onAddNewDatasourceComplete = function(newobj) {
                    // Uncollapse newly added datasource
                    setTimeout(function() {
                        var nElem = $("[data-ds-id='"+scope.graph.id+"-"+(scope.graph.datasources.length-1).toString()+"']");
                        nElem.collapse('show');
                        // Set focus to metric input.
                        nElem.find("[ng-model='query.metric']").focus();
                    }, 500);
                }

                var addNewDatasource = function() {
                    /* Adds new datasource */
                    Schema.get({schemaType: 'datasource/' + MetrilyxConfig.providers[0].type}, 
                        function(rslt) {
                            rslt.provider.name = MetrilyxConfig.providers[0].name;
                            rslt.provider.url = MetrilyxConfig.providers[0].url;

                            scope.graph.datasources.push(rslt);

                            onAddNewDatasourceComplete(rslt)
                        }, function(err) {
                            // TODO: notify
                            console.log(err);
                        }
                    );
                }

                var addNewSecondary = function() {
                    if (!scope.graph.secondaries) {
                        scope.graph.secondaries = [];
                    }
                    scope.graph.secondaries.push({
                        operation: "",
                        alias: "",
                        aggregator: ""
                    });
                }

                var copyDatasourceToPanel = function(ds, panel) {
                    console.log('copying');
                    var copy = angular.copy(ds);
                    // Remove id's.  Should be auto generated.
                    delete copy.id;
                    panel.datasources.push(copy);
                }


                var init = function() {
                    scope.addNewDatasource = addNewDatasource;
                    scope.addNewSecondary = addNewSecondary
                    scope.copyDatasourceToPanel = copyDatasourceToPanel;

                    scope.dsDragDropConfig = dsDragDropConfig;
                }

                init();
            }
        }
    }
])
.directive('panelContent', [
    '$rootScope', 'Schema', 'WebsockTransport', 'TimeWindowManager', 'GlobalTagsParser', 'AutoUpdateManager',
    function($rootScope, Schema, WebsockTransport, TimeWindowManager, GlobalTagsParser, AutoUpdateManager) {
        return {
            restrict: 'A',
            scope: {
                graph: '=',
                isATemplate: '&'
            },
            templateUrl: 'app/panel/content.html',
            link: function(scope, elem, attrs) {
                /* event listener for panel data from websocket */
                var _unregisterFunc,
                    _timer,
                    _panelType;
                
                var assembledRequest = function(update) {
                    var req = { tags: GlobalTagsParser.getGlobalTags() },
                        tWin;

                    if ( update && _panelType.isTimeSeries()) {
                        console.log('Update data (timeseries)...');
                        tWin = { start: '15m-ago' }
                        //console.log(TimeWindowManager.timeDimension);
                    } else {
                        // will only be affected if enabled
                        tWin = TimeWindowManager.getTimeWindow(TimeWindowManager.timeDimension, true);
                    }

                    return $.extend({}, req, tWin, scope.graph);
                }

                var requestPanelData = function(update) {

                    console.log('panel', scope.isATemplate());
                    
                    var req = assembledRequest(update);
                    if ( req.datasources.length > 0 ) {
                        $rootScope.$broadcast('panel:status:update:'+scope.graph.id, {
                            status: 'Requesting data...',
                            severity: 'info'
                        });
                        WebsockTransport.requestData(req);
                    } /*else {
                        $rootScope.$broadcast('panel:status:update:'+scope.graph.id, {
                            status: 'No datasources!',
                            severity: 'warning'
                        });
                    }*/
                }
                
                /* whether to start requesting data */
                var autoLoadData = function() {
                    if ( scope.isATemplate() ) {
                        var gtags = GlobalTagsParser.getGlobalTags();
                        if (Object.keys(gtags).length > 0) {
                            return true;
                        }
                        return false;
                    }
                    return  true;
                }

                var startFetchingUpdates = function() {
                    
                    if ( _timer ) clearTimeout(_timer);

                    if ( AutoUpdateManager.updatesEnabled() ) {
                        console.info("Requesting Update: ", scope.graph);
                        requestPanelData(true);
                    }
                    
                    _timer = setTimeout(function() {
                        startFetchingUpdates()
                    }, AutoUpdateManager.getUpdateInterval().value); 
                }

                /*
                 * Called when new data is received.
                 *
                 * @params:
                 *  data : panel data (i.e. data to be displayed in the panel)
                 */
                var onPanelData = function(evt, data) {

                    $rootScope.$broadcast('panel:status:update:'+scope.graph.id, {
                        status: 'Data received',
                        severity: 'info'
                    });

                    if ( data.data.error ) {
                        console.log(data.data.error);
                        scope.$apply(function() {
                            $rootScope.$broadcast('panel:status:update:' + data.id, {
                                status: data.data.error.substring(0, MAX_ERROR_LEN),
                                severity: 'warning'
                            });
                        });
                    } else {
                        if ( ! scope.data || ( scope.data.length < 1 )) {
                            _timer = setTimeout(function() {
                                startFetchingUpdates();
                            }, AutoUpdateManager.getUpdateInterval().value);
                            //console.log(TimeWindowManager.getTimeWindow())
                        }

                        scope.$apply(function() { 
                            scope.data = data.data; 
                            $rootScope.$broadcast('panel:status:update:'+scope.graph.id, {
                                status: 'Done',
                                severity: 'success'
                            });
                        });
                    }
                }

                var onPanelIdChange = function(newVal, oldVal) {
                    if ( ! newVal ) return;
                    _unregisterFunc = $rootScope.$on(newVal, onPanelData);
                    console.info("Added event listener: ", newVal);
                    //console.log(scope.graph);
                    _panelType = new PanelType(scope.graph.type);

                    requestPanelData();
                }

                var onDestroy = function() {
                    if(_timer) clearTimeout(_timer);
                    
                    _unregisterFunc(); 
                }

                var onPanelTypeChange = function(n, o) {
                    if (!n) return;
                    //console.log(n,o);
                    
                    if ( ( _panelType.isChart(n) !== _panelType.isChart(o) ) ||
                        ( _panelType.isTimeSeries(n) !== _panelType.isTimeSeries(o) ) ) {
                        
                        requestPanelData();
                    }
                }

                var onPanelRequestData = function(e, d) {
                    requestPanelData();
                }

                var onCopyInitiated = function(e, d) {
                    // disable pointer events so the object can be dropped/copied
                    elem.css('pointer-events', 'none');
                }

                var onCopyComplete = function(e, d) {
                    elem.css('pointer-events', 'auto');
                }

                var init = function() {
                    
                    scope.data = [];
                    scope.$watch(function() { return scope.graph.id; }, onPanelIdChange);
                    scope.$watch(function() {return scope.graph.type; }, onPanelTypeChange);
                    scope.$on('panel:request:data:'+scope.graph.id, onPanelRequestData);

                    scope.$on('copy:initiate', onCopyInitiated);
                    scope.$on('copy:complete', onCopyComplete);

                    scope.$on('$destroy', onDestroy);
                }

                init();
            }
        }
    }
])
.directive('textPanel', [ '$rootScope',
    function($rootScope) {
        return {
            restrict: 'E',
            templateUrl: 'app/panel/types/text-type.html',
            link: function(scope, elem, attrs) {
                /*
                scope.refreshView = function() {
                    $rootScope.$broadcast("panel:request:data:"+scope.graph.id, {});
                }*/
                var onPanelRefresh = function(evt, data) {
                    $rootScope.$broadcast("panel:request:data:"+data.id, data);
                }
                
                scope.$on("panel:refresh:"+scope.graph.id, onPanelRefresh);
            }
        }
    }
])
.directive('listPanel', [ '$rootScope',
    function($rootScope) {
        return {
            restrict: 'E',
            templateUrl: 'app/panel/types/list-type.html',
            link: function(scope, elem, attrs) {
                
                var onPanelRefresh = function(evt, data) {
                    $rootScope.$broadcast("panel:request:data:"+data.id, data);
                }

                scope.$on("panel:refresh:"+scope.graph.id, onPanelRefresh);
            }
        }
    }
])
.directive('graphPanel', [ '$rootScope', 'TimeWindowManager',
    function($rootScope, TimeWindowManager) {
        return {
            restrict: 'E',
            templateUrl: 'app/panel/types/graph-type.html',
            link: function(scope, elem, attrs) {

                var _graph;

                var onDataChanged = function(newVal, oldVal) {
                    if( newVal.length <= 0 ) return;

                    if ( _graph === undefined ) {
                        //console.log('initing graph...');
                        $rootScope.$broadcast('panel:status:update:'+scope.graph.id, {
                            status: 'Initializing graph...',
                            severity: 'info'
                        });
                        _graph = new MetrilyxGraph(scope.graph);
                    }

                    $rootScope.$broadcast('panel:status:update:'+scope.graph.id, {
                        status: 'Updating graph...',
                        severity: 'info'
                    });
                    // This may or may not take some time hence we update the status.
                    _graph.update(newVal, TimeWindowManager.getViewingWindow());
                    $rootScope.$broadcast('panel:status:update:'+scope.graph.id, {
                        status: 'Done',
                        severity: 'success'
                    });
                }

                var onPanelIdChange = function(n, o) {
                    _graph = new MetrilyxGraph(scope.graph);
                }

                var onDestroy = function() {
                    if ( _graph ) _graph.destroy();
                }

                var reflowGraph = function() {
                    if ( _graph !== undefined ) {
                        //console.log('reflowing');
                        _graph.reflow();
                    }
                }

                var onSizeChanged = function(n, o) {
                    //console.log('onSizeChanged:', n, o);
                    if ( n !== o ) reflowGraph();
                }

                var onPanelRefresh = function(evt, data) {
                    //console.log("destroying for refresh");
                    if ( _graph ) {
                        _graph.destroy();
                        _graph = undefined;
                    }

                    $rootScope.$broadcast("panel:request:data:"+data.id, data);
                }

                var onSidePanelChange = function(evt, data) {
                    // Wait for animation to complete before reflowing.
                    setTimeout(function() {
                        reflowGraph(); 
                    }, 500);
                }

                var init = function() {
                    
                    scope.$watch(function() { return scope.data; }, onDataChanged);
                    scope.$watch(function() { return scope.graph.size; }, onSizeChanged);
                    
                    scope.$on("panel:refresh:"+scope.graph.id, onPanelRefresh);
                    scope.$on("sidepanel:opened", onSidePanelChange);
                    scope.$on("sidepanel:closed", onSidePanelChange);
                    
                    scope.$on('$destroy', onDestroy);
                }

                init();
            }
        }
    }
])
.directive('autosizeToContent', [function() {
    return {
        restrict: 'A',
        link: function(scope, elem, attr) {

            elem.css('transition', 'all 0.35s ease');
            elem.elastic();
        }
    }
}])
.filter('datasourceLabel', function() {
    return function(datasource) {
        switch(datasource.type) {
            case "opentsdb":
                var obj = datasource.provider.query,
                    prefix = obj.rate ? obj.aggregator+" : rate : "+obj.metric : obj.aggregator+" : "+obj.metric,
                    tagsStr = tags2String(obj.tags, '=');

                if ( tagsStr == "" ) return prefix
                else return prefix + " { " + tagsStr + " }";

            default:
                return datasource.type;
        }
    }
});