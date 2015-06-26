function string2Tags(tags, delimiter) {
    var delim = delimiter ? delimiter : ":";
    var kvmap = {};
    var kvs = tags.split(",");
    for(var i=0; i< kvs.length; i++) {
        var kv = kvs[i].split(delim);
        if(kv.length != 2) {
            kvmap['error'] = 'invalid kv '+ kv;
            break;
        }
        kvmap[kv[0]] = kv[1];
    }
    return kvmap;
}

function tags2String(tags, delimiter) {
    //console.log(delimiter);
    var outStr = '';
    var delim = delimiter ? delimiter : ':';

    for(var k in tags) {
        outStr += k + delim + tags[k] + ',';
    }

    return outStr.replace(/\,$/, '');
}

angular.module("appFactories", [])
.factory("DashboardManager", [
    '$window', 'Model', 'Schema', '$routeParams', 'Base64Coder',
    function($window, Model, Schema, $routeParams, Base64Coder) {
    /*
     * Sets scope:
     *  dashboard
     *  saveDashboard()
     *  removeDashboard()
     */
    var DashboardManager = function(rootScope, scope, onDashboardLoadCallback) {

        var t = this;

        var _originalDash;

        var _dashOptsElem       = $('#dashboard-options');
        var _delConfirmElem     = $('#delete-confirm-bar');
        var _saveConfirmElem    = $('#save-confirm-bar');
        var _unsavedConfirmElem = $('#unsaved-confirm-bar');

        
        var _unsavedUrl = null;

        function copyPodToRow(pod, row) {
            var copy = angular.copy(pod);
            // Remove id's
            for(var i=0; i < pod.panels.length; i++) {
                delete pod.panels[i].id;
            }

            row.push([copy]);   
        }

        function addNewRow() {
            /* 
             * Appends row to layout
             */
            Schema.get({schemaType:'pod', skeleton:false, fresh:true}, 
                function(rslt) {
                    scope.dashboard.layout.push([[rslt]]);
                    //_dboardIdxr.buildIndex(scope.dashboard);
                }, function(err){
                    console.log(err);
                }
            );
        }

        function addNewPodToRow(row, append) {
            /*
             * Adds a pod to a given row. 
             *
             * @params:
             *
             *  row:    Row to add to 
             *  append: Append. If false prepend
             *
            */
            var prepend = append !== undefined ? !append : true;

            Schema.get({schemaType:'pod', skeleton:false, fresh:true}, 
                function(rslt) {
                    //console.log(rslt.panels);
                    if(prepend) {
                        row.unshift([rslt]);
                    } else {
                        row.push([rslt]);
                    }
                }, function(err){
                    console.log(err);
                }
            );
        }

        function addNewPanelToPod(pod) {
            /*
             * Adds new panel to a given pod
             *
             * @params
             *
             *  pod: Pod to which new panel should be added to.
             */
            Schema.get({schemaType: 'panel'}, function(rslt) {
                pod.panels.push(rslt);
            });
        }

        function _dashboardManagerErrback(err) {
            if(err.status == 0) {
                rootScope.$emit('notification', {
                    title: 'Connection failed', 
                    message: 'Could not connect to dashboard API!'
                });
            } else {
                rootScope.$emit('notification', {
                    title: 'Dashboard failed', 
                    message: err.data.error
                });
            }
        }

        function _removeModelCallback(rslt) {

            _dashOptsElem.modal('hide');
            _delConfirmElem.modal('hide');

            if(rslt.error) {
                
                rootScope.$emit('notification', {title: 'Removal failed', message: rslt.error});
            } else {

                rootScope.$emit('dashboard-list-changed', { 
                    'removed': { 
                        _id: scope.dashboard._id,
                        name: scope.dashboard.name 
                    }});
                /* allow modal animation to complete */
                setTimeout(function() { location.hash = "#/new"; }, 750);
            }
        }

        function removeDashboard() {

            Model.removeModel({pageId: scope.dashboard._id}, {},
                    _removeModelCallback, _dashboardManagerErrback);
        }

        function _saveModelCallback(rslt) {

            _dashOptsElem.modal('hide');
            _saveConfirmElem.modal('hide');
            
            if(_unsavedUrl != null) _unsavedConfirmElem.modal('hide');

            if(rslt.error) {

                rootScope.$emit('notification', {title: 'Save failed', message: rslt.error});
            } else {
                
                if($routeParams.pageId === "new") {

                    rootScope.$emit('dashboard-list-changed', {
                        'added': { 
                            _id: scope.dashboard._id,
                            name: scope.dashboard.name
                        }});
                    /* allow modal animation to complete (setTimeout) */
                    if( _unsavedUrl != null ) {
                        //console.log('unsaved');
                        setTimeout(function() {
                            location.href = _unsavedUrl;
                        }, 500);
                    } else {
                        
                        setTimeout(function() {
                            location.hash = "#/" + scope.dashboard._id;
                        }, 500);
                    }
                } else {
                    /* copy after dashboard has been edited */
                    _originalDash = angular.copy(scope.dashboard);
                    rootScope.$emit('notification', {
                        title: "Saved", 
                        message: scope.dashboard._id,
                        severity: 'success',
                    });

                    if( _unsavedUrl != null ) {
                        setTimeout(function() {
                            location.href = _unsavedUrl;
                        }, 500);
                    }
                }
            }
        }

        function saveDashboard() {
            //console.log(scope.dashboard);

            if($routeParams.pageId == 'new') {

                Model.saveModel({'pageId': scope.dashboard._id}, scope.dashboard, 
                                    _saveModelCallback, _dashboardManagerErrback);
            } else {

                Model.editModel({'pageId': scope.dashboard._id}, scope.dashboard,
                                    _saveModelCallback, _dashboardManagerErrback);
            }
        }
/*
        function addSecondaryMetric(graph) {
            graph.secondaries.push({
                alias: '',
                query: {
                    metrics: '',
                    aggregator: 'sum'
                },
                paneIndex: 0
            });
        }
*/
        function _convertDashToV3(dboard) {
            for(var r=0;r< dboard.layout.length;r++) {
                for(var c=0;c< dboard.layout[r].length;c++) {
                    for(var p=0;p< dboard.layout[r][c].length;p++) {
                        
                        var pod = dboard.layout[r][c][p];
                        pod.panels = pod.graphs;
                        //delete dboard.layout[r][c][p].graphs;
                        for(var g = 0; g < pod.panels.length; g++) {
                            
                            var panel = pod.panels[g];
                            panel.type = panel.graphType
                            panel.datasources = panel.series;

                            for( var d=0; d < panel.datasources.length; d++ ) {

                                var datasource = panel.datasources[d];
                                datasource.provider = "opentsdb";
                            }
                        }
                    }
                }
            }
            dboard.version = 3
            return dboard;
        }

        function dashboardHasChanged() {
            return !angular.equals(_originalDash, scope.dashboard);
        }

        function leaveWithoutSaving() {
            /*
             * Continues to the requested URL after user confirmation.
             */
            _unsavedConfirmElem.modal('hide');
            setTimeout(function() {
                location.href = _unsavedUrl;
            }, 500);
        }

        function _listenForUnsavedChanges() {
            /* 
             * Sets up listener to intercept navigation so user can be prompted
             * to save any unsaved changes.
             */
            rootScope.$on('$locationChangeStart', function(evt, nextUrl, currUrl) {
                /* Handle URL changes within the application */
                if( dashboardHasChanged() && _unsavedUrl == null) {

                    _unsavedUrl = nextUrl;
                    
                    _unsavedConfirmElem.modal('show');
                    evt.preventDefault();
                }
            });
            /* Handles URL requests to external links */
            $window.onbeforeunload = function(e) {
                if( dashboardHasChanged() ) {
                    return "Unsaved changes will be LOST!";
                } 
            }        
        }

        function _checkVersion(dboard) {
            switch(dboard.version) {
            case 3:
                break;
            default:
                /* convert all older dash's to v3 */
                dboard = _convertDashToV3(dboard);
                break;
            }
            //console.log(dboard.layout[0][0][0]);
            return dboard;
        }

        function isATemplate() {
            console.log("TEMPALTE")
            //console.log(scope.dashboard);
            if (scope.dashboard) {
                for( var i=0; i<scope.dashboard.tags.length; i++ ) {
                    if (scope.dashboard.tags[i] == 'template') return true;
                }
                return false;
            }
            return true;
        }


        function _getModel(cb) {
            if($routeParams.pageId !== 'new') {

                Model.getModel({pageId: $routeParams.pageId},
                    function(data) {

                        scope.dashboard = _checkVersion(data);
                        /* save original for exisiting dashboards */
                        _originalDash = angular.copy(scope.dashboard);

                        //var jstr = angular.toJson(scope.dashboard);
                        //var bstr = Base64Coder.encode(jstr);
                        //console.log(bstr);
                        //console.log(Base64Coder.decode(bstr));
                        
                        if(cb) cb(data);
                    },
                    function(err) { 
                        rootScope.$emit('notification', {
                            title: 'Dashboard: '+$routeParams.pageId, 
                            message: 'Retrieval failed: '+err.statusText});
                    });
            } else {
                // New Dashboard
                Schema.get({
                    schemaType: 'dashboard',
                    skeleton: 'false'
                }, function(data) {
                    /* this should contain a complete page skeleton */
                    data.name = "Dashboard Name";
                    scope.dashboard = data;
                    /* save original for exisiting dashboards */
                    _originalDash = angular.copy(scope.dashboard);
                    /*
                        var jstr = angular.toJson(scope.dashboard),
                            bstr = Base64Coder.encode(jstr);
                        
                        console.log(bstr, Base64Coder.decode(bstr));
                    */
                }, function(err) {
                    rootScope.$emit('notification', 
                        {title: 'Dashboard schema', message: err});
                });
            }
        }

        function _init() {

            _getModel(onDashboardLoadCallback); // scope.dashboard //
            _listenForUnsavedChanges();

            scope.leaveWithoutSaving = leaveWithoutSaving;
            scope.saveDashboard   = saveDashboard;
            scope.removeDashboard = removeDashboard;

            scope.addNewRow = addNewRow;
            //scope.addNewDatasourceToPanel = addNewDatasourceToPanel;
            scope.addNewPanelToPod = addNewPanelToPod;
            scope.addNewPodToRow = addNewPodToRow;

            scope.copyPodToRow = copyPodToRow;
            //scope.copyPanelToPod = copyPanelToPod;
            //scope.copyDatasourceToPanel = copyDatasourceToPanel;
            scope.isATemplate = isATemplate;

            t.dashboardHasChanged = dashboardHasChanged;
        }

        _init();
    }

    return (DashboardManager);
}])
.factory("Base64Coder", [
    function() {
        
        var encode = function encode(buffer) {

            var bstr = btoa(buffer);
            //console.log(bstr);

            return bstr
            .replace(/\+/g, '-') // Convert '+' to '-'
            .replace(/\//g, '_') // Convert '/' to '_'
            .replace(/=+$/, ''); // Remove ending '='
        };

        var decode = function decode(base64) {
          // Add removed at end '='
          base64 += Array(5 - base64.length % 4).join('=');
          base64 = base64
            .replace(/\-/g, '+') // Convert '-' to '+'
            .replace(/\_/g, '/'); // Convert '_' to '/'

          return atob(base64);
        
        };

        return {
            encode: encode,
            decode: decode
        };
    }
]);