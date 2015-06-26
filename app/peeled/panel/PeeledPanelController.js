angular.module('peeled.graph', [])
.controller('peeledPanelController', [ 
    '$rootScope', '$scope', '$routeParams', 'Authenticator', 'DashboardManager', 'PeelingService',
    function($rootScope, $scope, $routeParams, Authenticator, DashboardManager, PeelingService) {

        /*Authenticator.checkAuthOrRedirect("/"+
            $routeParams.pageId + "/" +
            $routeParams.rowIndex + "/" +
            $routeParams.columnIndex + "/" +
            $routeParams.podIndex + "/" +
            $routeParams.panelIndex);
        */
        $scope.graph = {};
        $scope.panels = [];
        $scope.dashboardMeta = $routeParams;
        

        var peelSvc, dashboardMgr, templateMgr;

        function _findPanelsAndGraph(dashboard) {
            try {
                $scope.panels = dashboard
                    .layout[$routeParams.rowIndex][$routeParams.columnIndex][$routeParams.podIndex]
                    .panels;
                console.log($scope.dashboardMeta);
                $scope.graph = $scope.panels[$routeParams.panelIndex];
                console.log($scope.graph);
                return true;
            } catch(e) {
                return false;
            }
        }

        function onDashboardLoaded(d) {
            console.log('peeled.graph');
            var status = _findPanelsAndGraph(d);
            //console.log(g);
            if(status === false) {
                $rootScope.$emit('notification', {
                    title: 'Graph not found', 
                    message:'Not found: '+$routeParams.panelIndex+' - '+$routeParams.pageId
                });
            }
        }
        
        function init() {
            
            peelSvc = new PeelingService($scope, 'graph');
            if(!peelSvc.parse()) {
                $rootScope.$emit('notification', {title: 'Graph not found', message:'Error: '+$routeParams});
                return;
            }
            // get, save, remove dashboards //
            dashboardMgr = new DashboardManager($rootScope, $scope, onDashboardLoaded);
            //webSockMgr = new WebsockMgr($rootScope, $scope);
        }

        init();
    }
]);