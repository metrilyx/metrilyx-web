angular.module('sidepanel', [])
.factory("SidePanelManager", [
    function() {
        /*
         * Sets scope:
         *  activeSidePanel
         *  setActiveSidePanel()
         */
        var SidePanelManager = function(scope) {

            scope.activeSidePanel = 'none';
        
            scope.setActiveSidePanel = function(panel) {
                
                if(scope.activeSidePanel === panel) {
                    scope.activeSidePanel = 'none';
                } else {
                    scope.activeSidePanel = panel;
                }
            
            }
        }
        return (SidePanelManager);
    }
])
.controller('sidePanelController', [
    '$rootScope', '$scope', 'MetrilyxConfig',
    function($rootScope, $scope, MetrilyxConfig) {
        
        $scope.annotationsEnabled = MetrilyxConfig.annotations.enabled;   
        $scope.globalTagsEnabled  = MetrilyxConfig.globaltags.enabled;

        var onActiveSidePanelChanged = function(n, o) {
            if ( n === o ) return;
            
            if (n == 'none' ) {
                $rootScope.$broadcast('sidepanel:closed', {});
            } else if ( o == 'none' ) {
                $rootScope.$broadcast('sidepanel:opened', {});
            }
            //console.log(n, o);
        }

        var init = function() {

            $scope.$watch(function() { return $scope.activeSidePanel; }, onActiveSidePanelChanged);
        }

        init();
    }
]);
