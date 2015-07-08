var app = angular.module('app', [ 'ngRoute', 'ngResource',
	'annotations',
	'globaltags',
	'dashboard',
	'peeled',
	'peeled.row',
	'peeled.column',
	'peeled.pod',
	'peeled.graph',
	'metrilyx.panel',
	'metrilyx.pod',
	'metrilyx.adhoc',
	'metrilyx.autocomplete',
	'metrilyx.autoupdater',
	'metrilyx.exporter',
	'login',
	'notifications',
	'sidepanel',
	'timeselector',
	'datasource.providers',
	'datasource.stream',
	'ui.sortable',
	'ui.bootstrap.datetimepicker',
	'appDirectives',
	'appFactories',
	'appControllers',
]);

/*
 * Bootstrap the app with the config fetched via http
 */
(function() {
	var configConstant = "MetrilyxConfig",
		configUrl = "/api/config"; // webroot/conf/config.json

    function fetchAndInjectConfig() {
        var initInjector = angular.injector(["ng"]);
        var $http = initInjector.get("$http");

        return $http.get(configUrl).then(function(response) {
            app.constant(configConstant, response.data);
        }, function(errorResponse) {
            // Handle error case
            console.log(errorResponse);
        });
    }

    function bootstrapApplication() {
        angular.element(document).ready(function() {
            angular.bootstrap(document, ["app"]);
        });
    }

    fetchAndInjectConfig().then(bootstrapApplication);
    
}());

app.config(['$routeProvider', 'MetrilyxConfig',
	function($routeProvider, MetrilyxConfig) {
		
		var _defaultRedirect = MetrilyxConfig.auth.enabled ? '/login' : '/new';

		$routeProvider.
			when('/login', {
				templateUrl: 'app/login/login.html',
				controller: 'loginController'
			})
			.when('/admin', {
				templateUrl: 'partials/admin.html',
				controller: 'adminController'
			})
			.when('/:pageId/:rowIndex/:columnIndex/:podIndex/:panelIndex', {
				templateUrl: 'app/peeled/panel/peeled-panel.html',
				controller: 'peeledPanelController'
			})
			.when('/:pageId/:rowIndex/:columnIndex/:podIndex', {
				templateUrl: 'app/peeled/pod/peeled-pod.html',
				controller: 'peeledPodController'
			})
			.when('/:pageId/:rowIndex/:columnIndex', {
				templateUrl: 'app/peeled/column/peeled-column.html',
				controller: 'peeledColumnController'
			})
			.when('/:pageId/:rowIndex', {
				templateUrl: 'app/peeled/row/peeled-row.html',
				controller: 'peeledRowController'
			})
			.when('/:pageId', {
				templateUrl: 'partials/dscaffold.html',
				controller: 'dashboardController'
			})/*
			.when('/', {
				templateUrl: 'partials/dscaffold.html',
				controller: 'adhocController'
			})*/
			.otherwise({
				redirectTo: _defaultRedirect
			});
	}
]);

/*
 * Used to calculate the column with for bootstrap class
 * ie. col-md-XX
 *
 */
app.filter('columnWidth', function() {
	return function(obj) {
		return Math.floor(12/obj.length);
	}
})
.filter('graphLayoutChange', function() {
	return function(layout) {
		if(layout === "vertical") {
			return "Horizontal";
		}
		return "Vertical";
	}
})
.filter('array2string', function() {
	return function(arr) {
		if(arr) return arr.join(',');
		return "";
	}
})
.filter('objectLength', function() {
	return function(obj) {
    	return Object.keys(obj).length;
	};
})
.filter('formattedDashboardMeta', function() {
	var str;
	return function(obj) {
		if(obj.panelIndex != undefined) 
			str = "Row: "+obj.rowIndex+
				", Column: "+obj.columnIndex+
				", Pod: "+obj.podIndex+
				", Panel: "+obj.panelIndex;
		else if(obj.podIndex != undefined)
			str = "Row: "+obj.rowIndex+
				", Column: "+obj.columnIndex+
				", Pod: "+obj.podIndex;
		else if(obj.columnIndex != undefined)
			str = "Row: "+obj.rowIndex+
				", Column: "+obj.columnIndex;
		else if(obj.rowIndex != undefined)
			str = "Row: "+obj.rowIndex;
		else
			str = "";

		return str;
	}
});
