angular.module('dashboard')
.directive('modelImporter', ['$rootScope', 'Model', function($rootScope, Model) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs, ctrl) {

            var importerInput = document.getElementById('model-importer-input');

            function importModel(singleFile) {
                var freader = new FileReader();
                freader.onload = function(evt) {

                    try {
                        jobj = JSON.parse(evt.target.result);
                        Model.saveModel({pageId: jobj._id}, jobj, function(rslt) {

                            $rootScope.$emit('dashboard-list-changed', {'added': { 
                                _id: jobj._id, name: jobj.name
                            }});

                            $rootScope.$emit('notification', {
                                title: "Imported: "+jobj._id, 
                                message: "Dashboard imported "+jobj._id,
                                severity: 'success',
                            });
                            
                            //console.log(rslt);
                        });
                    } catch(e) {
                        console.error("Could not import model", singleFile.name, e);
                        $rootScope.$emit('notification', {
                            title: "Import failed!", 
                            message: "Could not import: "+singleFile.name,
                        });
                    }
                };
                freader.readAsText(singleFile);
            }

            function _init() {

                elem[0].addEventListener('click', function(evt) {
                    importerInput.click();
                });

                importerInput.addEventListener('change', function(evt) {

                    var iFiles = importerInput.files;
                    for(var i=0; i < iFiles.length; i++) {
                        if(iFiles[i].type === "application/json") {
                            importModel(iFiles[i]);
                        }
                    }
                });
            }

            _init();
        }
    };
}])
.directive('dashboardsList', [ '$rootScope', 'Model', '$routeParams', 
    function($rootScope, Model, $routeParams) {
        return {
            restrict: 'E',
            scope: {
                activeSidePanel: '=',
                setActiveSidePanel: '&'
            },
            templateUrl: 'app/dashboards/dashboards-listing.html',
            link: function(scope, elem, attrs, ctrl) {

                scope.dashboardSearch = "";
                scope.dashboardList = [];

                var _unregListChange;

                var fetchDashboardList = function() {

                    Model.listModels(
                        function(data) {
                            scope.dashboardList = data;
                        }, 
                        function(err) { 
                            if(err.status == 0) 
                                $rootScope.$emit('notification', {
                                    title: 'Dashboard listing failed', 
                                    message:'Failed to retrieve dashboard listing!'
                                });
                            else 
                                $rootScope.$emit('notification', {
                                    title: 'Dashboard listing failed', 
                                    message: err
                                });
                        }
                    );
                }

                var init = function() {
                    /* initial populate */
                    fetchDashboardList();
                    /* reload on save and remove */
                    _unregListChange = $rootScope.$on('dashboard-list-changed', function(evt, data) {
                        if(data.added) scope.dashboardList.push(data.added);
                        /* allow elastic search to index the document before requesting a new list */
                        setTimeout(fetchDashboardList, 2000);
                    });

                    scope.$on('$destroy', function() { 
                        _unregListChange(); 
                    });
                }

                init();
            }
        }
    }
])
.factory('Model', ['$resource', 'HTTPBasicAuth', 'MetrilyxConfig',
    function($resource, HTTPBasicAuth, MetrilyxConfig) {

        var requestUrl = MetrilyxConfig.endpoints.dashboards + '/:pageId';
        //'http://localhost:8000/api/graphmaps/:pageId'
        return $resource(requestUrl, {}, {
            getModel: {
                method : 'GET',
                params : { pageId: '@pageId' },
                isArray: false
            },
            listModels:{
                method : 'GET',
                isArray: true
            },
            saveModel: {
                method : 'POST',
                isArray: false,
                params : { pageId: '@pageId' },
                /*headers: HTTPBasicAuth.authHeaders("admin", "metrilyx")*/
            },
            editModel: {
                method : 'PUT',
                params : { pageId: '@pageId' },
                isArray: false,
                /*headers: HTTPBasicAuth.authHeaders("admin", "metrilyx")*/
            },
            removeModel:{
                method : 'DELETE',
                params : { pageId: '@pageId' },
                /*headers: HTTPBasicAuth.authHeaders("admin", "metrilyx")*/
            }
        });
    }
])
.factory('Schema', ['$http', 'MetrilyxConfig',
    function($http, MetrilyxConfig) {
        var cache = {};

        return {
            get : function(params, cb, eb){
                var dfd = $.Deferred();
                var skel = params.skeleton !== undefined ? params.skeleton : true;
                var fresh = params.fresh !== undefined ? params.fresh : false;
                var cacheKey = params.schemaType+'-'+skel;
                var requestUrl = MetrilyxConfig.endpoints.schemas+'/'+params.schemaType+'?skeleton='+skel;

                if (params.schemaType === 'panel' || cache[cacheKey] === undefined || fresh === true) {
                    //var requestUrl = 'http://localhost:9090/api/schemas/'+params.schemaType+'?skeleton='+skel;
                    $http.get(requestUrl)
                    .success(function(res) {
                        if(params.schemaType !== 'panel') {
                            dfd.resolve(res)
                        } else {
                            cache[cacheKey] = res;
                            dfd.resolve($.extend(true, {}, res));
                        }
                    })
                    .error(function(data, status, headers, config) {
                        var err = status === 0 ? "Service unavailable: "+requestUrl : data;
                        dfd.reject(err);
                    });
                } else {
                    dfd.resolve($.extend(true, {}, cache[cacheKey]));
                }
                dfd.then(cb, eb);
            }
        }
    }
])
.directive('dashboardRow', ['Schema', function(Schema) {
    'use strict';

    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;

            scope.$watch(function() { return ctrl.$modelValue; }, function(newVal, oldVal) {
                if(!newVal) return;
                /* Remove any empty columns */
                for(var i=0; i < newVal.length; i++) {
                    if(newVal[i].length <= 0) newVal.splice(i,1);
                }
            }, true);

        }
    }
}])
.directive('dashboardLayout', ['Schema', function(Schema) {
    'use strict';

    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;
            
            scope.$watch(function() { return ctrl.$modelValue; }, function(newVal, oldVal) {
                if(!newVal) return;
                /* Remove any empty rows */
                for(var i=0; i < newVal.length; i++) {
                    if(newVal[i].length <= 0) newVal.splice(i,1);
                }
            }, true);       
        }
    }
}]);