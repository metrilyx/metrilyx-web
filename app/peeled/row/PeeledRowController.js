angular.module('peeled.row', [])
.controller('peeledRowController', [ 
    '$rootScope', '$scope', '$routeParams', 
    'MetrilyxConfig', 'Authenticator', 'DashboardManager', 'PeelingService',
    function($rootScope, $scope, $routeParams, 
        MetrilyxConfig, Authenticator, DashboardManager, PeelingService) {

        Authenticator.checkAuthOrRedirect("/"+
            $routeParams.pageId+"/"+
            $routeParams.rowIndex);

        $scope.row = [];
        $scope.dashboardMeta = $routeParams;

        var peelSvc, dashboardMgr;

        function onDashboardLoaded(d) {
            console.log('peeled.row');
            try {
                $scope.row = $scope.dashboard.layout[$routeParams.rowIndex];
                console.log($scope.row);
            } catch(e) {
                $rootScope.$emit('notification', {title: 'Row not found!', message: e});
            }
        }

        function init() {
            peelSvc = new PeelingService($scope, 'row');
            if(!peelSvc.parse()) {
                $rootScope.$emit('notification', {
                    title: 'Row not found', 
                    message:'Error: '+$routeParams
                });
                return;
            }
            //templateMgr  = new TemplateManager($scope);
            dashboardMgr = new DashboardManager($rootScope, $scope, onDashboardLoaded);
            //webSockMgr   = new WebsockMgr($rootScope, $scope);
        }

        init();
    }
]);