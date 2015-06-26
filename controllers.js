
var appControllers = angular.module('appControllers', [])
.controller('dashboardController', [
	'$window', '$routeParams', '$rootScope', '$scope',
	'MetrilyxConfig', 'Authenticator', 'DashboardManager',
	function($window, $routeParams, $rootScope, $scope,
		MetrilyxConfig, Authenticator, DashboardManager) {

		console.log('dashboardController:init');
		//Authenticator.checkAuthOrRedirect();

		var dashboardMgr;

		$scope.apiURL = MetrilyxConfig.endpoints.dashboards;

		//$scope.helpersActive = $routeParams.pageId === 'new' ? true : false;
		$scope.helpersActive = false;

		$scope.layoutDragDropConfig = {
			tolerance: 'pointer',
			cursor:'move',
			handle:'.row-handle>.row-move-handle', 
			axis:'y',
			scrollSensitivity: 15,
		};

		$scope.rowDragDropConfig = {
			tolerance: 'pointer',
			cursor:'move',
			connectWith: ['.row[dashboard-row]'], 
			items: '.column[dashboard-column]',
			scrollSensitivity: 15,
			handle: '.pod-handle'
		};
		// get, save, remove dashboards //
		dashboardMgr = new DashboardManager($rootScope, $scope);
		//console.log($scope.isATemplate());
	}
])
.controller('adhocController', [
	'$rootScope', '$scope', '$location', 'Base64Coder', 'Schema',
	function($rootScope, $scope, $location, Base64Coder, Schema) {

		var dashboardMgr, 
			params = $location.search();
		
		if (params.data) {
			var jstr = Base64Coder.decode(params.data);
			var dashboard = angular.fromJson(jstr);
			console.log(dashboard);

			// do some checking

			$scope.dashboard = dashboard;
		} else {
			//console.log(params);
			//dashboardMgr = new DashboardManager($rootScope, $scope);
			Schema.get({
                schemaType: 'dashboard',
                skeleton: 'false'
            }, function(rslt) {
            	//console.log(rslt);
            	$scope.dashboard = rslt;
            }, function(err) { console.log(err); });
		}

	}
])
.controller('adminController', [ '$scope', 'Authenticator', 'ConfigManager',
	function($scope, Authenticator, ConfigManager) {

		Authenticator.checkAuthOrRedirect();

		$scope.config = {}

		ConfigManager.getConfig(function(cfg) {
			$scope.config = cfg;
		}, function(err) {
			console.error(err);
		});
	}
])
.controller('defaultController', [ 
	'$window', '$location', '$rootScope', '$scope', 'SidePanelManager', 'MetrilyxConfig', 'Authenticator', 'WebsockTransport',
	function($window, $location, $rootScope, $scope, SidePanelManager, MetrilyxConfig, Authenticator, WebsockTransport) {

		var sidePanelMgr;
		//webSockMgr;

		$scope.isSessionAuthed     = Authenticator.sessionIsAuthenticated();
		$scope.timeselectorEnabled = MetrilyxConfig.timeselector.enabled;

		$scope.logOut = Authenticator.logOut;

		$scope.connectionStatus = WebsockTransport.status;

		var onConnectStatusChanged = function(evt, data) {
			$scope.$apply(function() {
				$scope.connectionStatus = data.status;
			});
		}

	    function init() {
	    	sidePanelMgr = new SidePanelManager($scope);

            $rootScope.$on('auth:user:success', function(evt, data) {
                $scope.isSessionAuthed = true;
            });
            $rootScope.$on('deauth:user:success', function(evt, data) {
                $scope.isSessionAuthed = false;
            });
            $rootScope.$on('websocket:connection', onConnectStatusChanged);

            //console.log($scope.connectionStatus);
        }

	    init();
	}
]);
