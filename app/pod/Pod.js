'use strict';
angular.module('metrilyx.pod', [])
.directive('metrilyxPod', ['$rootScope', function($rootScope) {
    return {
        restrict: 'EA',
        scope: {
            pod: '=',
            column: '=',
            dndConfig: '=',
            dashboardId: '=',
            podIndex: '@',
            columnIndex: '@',
            rowIndex: '@',
            isATemplate: '&'
        },
        templateUrl: 'app/pod/pod.html',
        link: function(scope, elem, attrs) {
            
            var _tmpCopy;

            scope.controlsVisible = false;

            scope.toggleControls = function() {
                scope.controlsVisible = !scope.controlsVisible;
            }

            scope.panelDragDropConfig = {
                cursor: 'move',
                connectWith: '[data-pod-dnd]',
                handle: '.panel-mv-handle',
            };

            var onCopyClick = function(evt) {
                //console.log(evt);
                scope.$apply(function() {
                    scope.pod.panels = scope.pod.panels.concat(_tmpCopy);
                });
                
                $rootScope.$broadcast("copy:complete", {});
            }

            var onCopyInitiated = function(e, d) {
                if ( d.type == 'panel' ) {
                    
                    _tmpCopy = d.list;
                    // to avoid registering the initial click
                    setTimeout(function() {
                        elem.click(onCopyClick);
                    }, 500);
                }
            }

            var onCopyComplete = function(e, d) {
                elem.unbind('click', onCopyClick);
                _tmpCopy = undefined;
            }

            scope.$on("copy:initiate", onCopyInitiated);
            scope.$on("copy:complete", onCopyComplete);
        }
    }
}])
.directive('podControls', ['$rootScope', 'Schema', function($rootScope, Schema) {
    return {
        restrict: 'E',
        templateUrl: 'app/pod/pod-controls.html',
        link: function(scope, elem, attrs) {

            scope.addNewPanel = function() {
                Schema.get({schemaType: 'panel'}, function(rslt) {
                    /*
                    console.log(rslt);
                    Schema.get({schemaType: 'datasource/'+MetrilyxConfig.providers[0].type},
                        function(rslt) {},
                        function(err) {})
                    */
                    //v3
                    scope.pod.panels.push(rslt);
                });
            }
        }
    }
}]);