angular.module('peeled.pod', [])
.controller('peeledPodController', [ 
    '$rootScope', '$scope', '$routeParams', 'Authenticator', 'DashboardManager', 'PeelingService',
    function($rootScope, $scope, $routeParams, Authenticator, DashboardManager, PeelingService) {

        $scope.pod = {};
        $scope.column = [];

        $scope.dashboardMeta = $routeParams;

        var peelSvc, dashboardMgr, templateMgr;

        function onDashboardLoaded(d) {
            console.log('peeled.pod');

            try {
                $scope.column = $scope.dashboard.layout[$routeParams.rowIndex][$routeParams.columnIndex];
                $scope.pod = $scope.column[$routeParams.podIndex];
            } catch(e) {
                $rootScope.$emit('notification', {title: 'Pod not found', message:'Error: '+err});
            }
        }

        function init() {
            peelSvc = new PeelingService($scope, 'pod');
            if(!peelSvc.parse()) {
                $rootScope.$emit('notification', {title: 'Pod not found', message:'Error: '+JSON.stringify($routeParams)});
                return;
            }
            // get, save, remove dashboards //
            dashboardMgr = new DashboardManager($rootScope, $scope, onDashboardLoaded);  
            //webSockMgr = new WebsockMgr($rootScope, $scope);
        }

        init();
    }
]);