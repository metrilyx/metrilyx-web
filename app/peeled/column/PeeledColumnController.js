angular.module('peeled.column', [])
.controller('peeledColumnController', [ 
    '$rootScope', '$scope', '$routeParams', 
    'MetrilyxConfig', 'Authenticator', 'DashboardManager', 'PeelingService',
    function($rootScope, $scope, $routeParams, 
        MetrilyxConfig, Authenticator, DashboardManager, PeelingService) {

        Authenticator.checkAuthOrRedirect("/"+
            $routeParams.pageId+"/"+
            $routeParams.rowIndex+"/"+
            $routeParams.columnIndex);

        $scope.column = [];
        $scope.dashboardMeta = $routeParams;

        var peelSvc, dashboardMgr;

        function onDashboardLoaded(d) {
            console.log('peeled.column');
            try {
                $scope.column = $scope.dashboard.layout[$routeParams.rowIndex][$routeParams.columnIndex];
            } catch(e) {
                $rootScope.$emit('notification', {title: 'Column not found!', message: e});
            }
        }

        function init() {
            peelSvc = new PeelingService($scope, 'column');
            if(!peelSvc.parse()) {
                $rootScope.$emit('notification', {title: 'Column not found', message:'Error: '+$routeParams});
                return;
            }

            // get, save, remove dashboards //
            dashboardMgr = new DashboardManager($rootScope, $scope, onDashboardLoaded);
            //webSockMgr = new WebsockMgr($rootScope, $scope);
        }

        init();
    }
]);