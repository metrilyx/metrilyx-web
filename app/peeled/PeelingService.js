angular.module("peeled", [])
.factory("PeelingService", ['$routeParams',
    function($routeParams) {

        var PeelingService = function(scope, peelType) {
            
            var t = this;
            t.peelType = peelType;

            function _parseColumnIndex() {
                var _columnIndex = parseInt($routeParams.columnIndex);
                if(_columnIndex === NaN) {
                    return false;
                }           
                $routeParams.columnIndex = _columnIndex;                                     
                return true;
            }

            function _parsePodIndex() {
                if(_parseColumnIndex()) {
                    var _podIndex = parseInt($routeParams.podIndex);
                    if(_podIndex === NaN) {
                        return false;
                    }
                    $routeParams.podIndex = _podIndex;
                    return true;
                }
                return false;
            }

            function _parseGraphIndex() {
                if(_parsePodIndex()) {
                    var _graphIndex = parseInt($routeParams.graphIndex);
                    if(_graphIndex === NaN) {
                        return false
                    }
                    $routeParams.graphIndex = _graphIndex;
                    return true;
                }
                return false;
            }

            function _parseRouteParams() {

                var _rowIndex = parseInt($routeParams.rowIndex);
                if(_rowIndex === NaN) {
                    return false; // failed to parse //
                }
                $routeParams.rowIndex = _rowIndex; // will always have a row //

                switch(t.peelType) {
                    case "row":
                        return true;
                    case "column":
                        return _parseColumnIndex();
                    case "pod":
                        return _parsePodIndex();
                    case "graph":
                        return _parseGraphIndex();
                    default:
                        return false;
                }
            }

            function initialize() {
                t.parse = _parseRouteParams;
                scope.peeled = true;
            }

            initialize();
        }

        return (PeelingService);
    }
]);