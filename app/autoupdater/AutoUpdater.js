angular.module('metrilyx.autoupdater', [])
.factory('AutoUpdateManager', ['TimeWindowManager', 
    function(TimeWindowManager) {
    
        var _enabled,
            _updateInterval,
            _updateIntervals;

        var setUpdateInterval = function(val) { 
            _updateInterval = val; 
            if ( _updateInterval.value == false ) _enabled = false
            else _enabled = true;
        }

        var disableUpdates = function() {
            _enabled = false;
            _updateInterval = _updateIntervals[_updateIntervals.length-1];
        }

        var init = function() {
            
            _updateIntervals = [
                { label: '45 secs',  value: 45000 },
                { label: '1 min',    value: 60000 },
                { label: '2 mins',   value: 120000 },
                { label: '3 mins',   value: 180000 },
                { label: '5 mins',   value: 300000 },
                { label: '10 mins',  value: 600000 },
                { label: 'Off', value: false }
            ];

            _enabled = TimeWindowManager.timeDimension.activeType == 'Relative' ? true : false;

            if ( _enabled ) _updateInterval = _updateIntervals[0];
            else _updateInterval = _updateIntervals[_updateIntervals.length-1];
        }

        init();

        return {
            updatesEnabled   : function() { return _enabled; },
            disableUpdates   : disableUpdates,
            updateIntervals  : function() { return _updateIntervals; },
            setUpdateInterval: setUpdateInterval,
            getUpdateInterval: function() { return _updateInterval; }
        };
    }
])
.directive('autoUpdater', ['AutoUpdateManager', function(AutoUpdateManager) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/autoupdater/auto-updater.html',
        link: function(scope, elem, attrs) {

            scope.updateIntervals = AutoUpdateManager.updateIntervals();
            scope.selectedInterval = AutoUpdateManager.getUpdateInterval();

            scope.setUpdateInterval = function(interval) {
                AutoUpdateManager.setUpdateInterval(interval);
                scope.selectedInterval = AutoUpdateManager.getUpdateInterval();
            }
        }
    };
}]);