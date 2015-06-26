'use strict';

var DEFAULT_AGGRS = ['avg', 'min', 'max', 'sum'];

angular.module('datasource.providers', [])
.factory('ProviderManager', ['MetrilyxConfig', function(MetrilyxConfig) {
    return {
        getProviderByName: function(name) {
            for ( var i=0; i < MetrilyxConfig.providers.length; i++ ) {
                if ( MetrilyxConfig.providers[i].name == name ) 
                    return MetrilyxConfig.providers[i];
            }
            return null
        }
    };
}])
.directive('datasourceProvider', ['Schema', 'MetrilyxConfig', 'ProviderManager', function(Schema, MetrilyxConfig, ProviderManager) {

    return {
        restrict: 'A',
        scope: {
            datasource: '='
        },
        templateUrl: "app/providers/provider.html",
        link: function(scope, elem, attrs, ctrl) {
            
            var onProviderChange = function(newVal, oldVal) {
                if(newVal === undefined) return;
                else if(newVal === oldVal) return;

                console.log('New val:', newVal);
                
                // Find provider
                var tProvider = ProviderManager.getProviderByName(newVal);
                /*
                for(var i=0; i < MetrilyxConfig.providers.length; i++) {
                    if(MetrilyxConfig.providers[i].name == newVal) {
                        tProvider = MetrilyxConfig.providers[i];
                        break;
                    }
                }*/
                if(!tProvider) {
                    console.error('Should never be here!');
                    return;
                }
                // load template for datasource type //
                Schema.get({schemaType: 'datasource/' + tProvider.type}, 
                    function(rslt) {
                        
                        if(tProvider.type !== 'http') {

                            rslt.provider.url = tProvider.url;
                            rslt.provider.method = tProvider.method;
                        }
                        
                        rslt.provider.name = tProvider.name;

                        scope.datasource.type = rslt.type;
                        scope.datasource.provider = rslt.provider;
                    }, function(err) {
                        console.log(err);
                    }
                );
            }

            var init = function() {
                scope.providerTypes = MetrilyxConfig.providers;    
                scope.$watch(function() { return scope.datasource.provider.name; }, onProviderChange, true);
            }

            init();
        }
    }
}])
.directive('httpProviderQuery', [function() {
    return {
        restrict: 'E',
        scope: {
            provider: '='
        },
        templateUrl: 'app/providers/http-provider.html',
        link: function(scope, elem, attrs) {
            scope.aggregators = DEFAULT_AGGRS;
        }
    }
}])
.directive('httpProviderParams', [function() {
    return {
        restrict: 'AE',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;

            var view2model = function(viewVal) {
                var out = {};
                
                var arr = viewVal.split("&");
                for(var i=0; i < arr.length; i++) {
                    var pkv = arr[i].split("=");
                    
                    if (pkv.length !== 2) {
                        ctrl.$setValidity('httpProviderParams', false);
                        return ctrl.$modelValue;
                    }
                    if(pkv[0] == "" || pkv[1] == "") {
                        //console.log(pkv);
                        ctrl.$setValidity('httpProviderParams', false);
                        return ctrl.$modelValue;   
                    }

                    if(!out[pkv[0]]) out[pkv[0]] = [];
                    out[pkv[0]].push(pkv[1]);
                }

                ctrl.$setValidity('httpProviderParams', true);
                return out;
            }

            var model2view = function(modelVal) {
                var arr = [];
                for ( var k in  modelVal ) {
                    arr.push(k+'='+modelVal[k]);
                }
                return arr.join("&");
            }

            var init = function() {
                ctrl.$formatters.push(model2view);
                ctrl.$parsers.unshift(view2model);
            }

            init();
        }
    }
}])
.directive('httpProviderBody', [function() {
    return {
        restrict: 'AE',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;

            var view2model = function(viewVal) {
                try {
                    var out = angular.fromJson(viewVal);
                    ctrl.$setValidity('httpProviderBody', true);
                    return out;
                } catch(e) {
                    ctrl.$setValidity('httpProviderBody', false);
                    return ctrl.$modelValue;
                }
            }

            var model2view = function(modelVal) {
                return angular.toJson(modelVal, true);
            }

            var init = function() {
                ctrl.$formatters.push(model2view);
                ctrl.$parsers.unshift(view2model);
            }

            init();
        }
    }
}])
.directive('opentsdbProviderQuery', [function() {
    return {
        restrict: 'E',
        scope: {
            query: '=',
            providerName: '='
        },
        templateUrl: 'app/providers/opentsdb-provider.html',
        link: function(scope, elem, attrs) {

            scope.aggregators = DEFAULT_AGGRS;

            scope.removeTag = function(tagkey) {
                delete scope.query.tags[tagkey];
            }
        }
    }
}])
.factory('OpenTsdbSearch', ['$http', 'ProviderManager', 
    // suggest endpoint for opentsdb
    function($http, ProviderManager) {

        var cache = {};

        var suggest = function(providerName, searchType, query, callback) {
            
            var prov = ProviderManager.getProviderByName(providerName);
            if ( prov == null ) {
                console.error("Provider not found:", providerName);
                return;
            }

            var dfd = $.Deferred();
            
            if ( query == "" ) {
                dfd.resolve([]);
            
            } else if( cache[query] === undefined ) {
                $http.get('http://'+prov.host+'/api/suggest?type='+searchType+'&q='+query)
                    .success(function(res){
                        cache[query] = res;
                        dfd.resolve(res);
                    });
            
            } else {

                dfd.resolve(cache[query]);
            
            }
            
            dfd.done(callback);
        }

        return {
            suggest: suggest
        };
    }
]);
