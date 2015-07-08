'use strict';

angular.module('metrilyx.adhoc', [])
.directive('metricLister', ['OpenTsdbSearch', function(OpenTsdbSearch) {
    return {
        restrict: 'AE',
        templateUrl: 'app/adhoc/metric-lister.html',
        link: function(scope, elem, attrs) {

            //var inputElem = $("#metric-search-input");

            scope.metricSearchRslt = [];
            scope.selectedAllMetrics = false;
            scope.metricSearch = "";

            var searchForMetric = function() {
                //console.log(inputElem);
                //inputElem.keyup(function(e) {
                console.log(scope.metricSearch);
                    OpenTsdbSearch.suggest('opentsdb.prod', 'metrics', scope.metricSearch, 
                    function(rslt) {
                        var arr = [];
                        for(var i=0;i<rslt.length;i++) {
                            arr.push({name:rslt[i], selected:false});
                        }
                        scope.metricSearchRslt = arr; 
                        //console.log(scope.metricSearchRslt);
                    });
                //});
            }

            var toggleSelectAll = function() {
                scope.selectedAllMetrics = !scope.selectedAllMetrics
                //console.log(scope.selectedAllMetrics);
                for(var i=0; i<scope.metricSearchRslt.length;i++) {
                    scope.metricSearchRslt[i].selected = scope.selectedAllMetrics;
                }
                console.log(scope.metricSearchRslt);
            }

            var init = function() {
                
                scope.toggleSelectAll = toggleSelectAll;
                scope.searchForMetric = searchForMetric;
                //setupMetricSearch();
            }

            init();

        }
    }
}]);