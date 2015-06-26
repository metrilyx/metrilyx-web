'use strict';

angular.module('notifications', [])
.directive('notifications', [function() {
    return {
        restrict: 'E',
        templateUrl: 'app/notifications/notifications.html',
        link: function(scope, elem, attrs, ctrl) {

        }
    }
}])
.controller('notificationsController', [ '$rootScope', '$scope',
    function($rootScope, $scope) {

        $scope.notifications = [];

        var _defaultSeverity = "danger";
        var _unregFunc;

        var onNotification = function(evt, data) {
            //console.log(evt, data);
            if(data) {
                if (!data.severity) data.severity = _defaultSeverity;
                
                //$scope.$apply(function() {
                //    $scope.notifications.unshift(data); 
                //});

                //console.log($scope.notifications);
                if(data.severity === 'success') {
                    
                    setTimeout(function(n) {
                        var idx = $scope.notifications.indexOf(n);
                        if(idx >= 0) $scope.$apply(function() { $scope.notifications.splice(idx, 1); });
                    
                    }, 2500, $scope.notifications[0]);
                }
            }
        }


        function init() {
            _unregFunc = $rootScope.$on('notification', onNotification);
            
            $scope.$on('$destroy', function() { _unregFunc(); });
        }

        init();
    }
]);