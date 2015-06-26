angular.module('dashboard', [])
.directive('dashboardHeader', [function() {
    return {
        restrict: 'E',
        require: '?ngModel',
        templateUrl: 'app/dash-header/dashboard-header.html',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;
        }
    }
}])
.directive('dashboardExporter', [function() {
    return {
        restrict: 'E',
        templateUrl: 'app/exporter/exporter.html',
        link: function(scope, elem, attrs) {
        }
    }
}]);