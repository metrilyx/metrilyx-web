angular.module('metrilyx.exporter', [])
.directive('pdfExporter', [function() {
    return {
        restrict: 'A',
        scope: {},
        link: function(scope, elem, attr) {

            var getDomString = function() {

                //var eElem = document.getElementById('dashboard-container');
                //console.log(eElem);
            }



            var init = function() {
                elem.click(getDomString);
                //scope.exportAsPdf = getDomString;
            }

            init();
        }
    };
}]);