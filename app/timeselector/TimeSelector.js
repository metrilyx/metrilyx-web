angular.module('timeselector', [])
.factory("TimeWindowManager", [ '$location', '$routeParams', '$rootScope', 'MetrilyxConfig', 
    function($location, $routeParams, $rootScope, MetrilyxConfig) {

        var DATE_TIME_FORMAT = "YYYY.MM.DD-HH:mm:ss";
        var REL_MATCH_REGEX = /((\d+[\.\d+]*)([s|m|h|d|w]))-ago/;
        var DEFAULT_RELATIVE_START = '1h';

        var timeDimension = {
            types: {
                Relative: { start: DEFAULT_RELATIVE_START },
                Absolute: { 
                    start: new Date((new Date()).getTime()-(1*3600000)), 
                    end: new Date() 
                }
            },
            activeType: 'Relative'
        };

        var padTime = function(val) {
            if(val < 10) return "0"+val.toString();
            return val.toString();
        }

        var formattedDateTime = function(d) {
            return d.getUTCFullYear()+'.'+padTime(d.getMonth()+1)+'.'+padTime(d.getDate())+
                '-'+padTime(d.getHours())+':'+padTime(d.getMinutes())+':'+padTime(d.getSeconds());
        }

        var relativeTimeString = function(relTimeObj) {
            //return relTimeObj.value.toString()+relTimeObj.unit+'-ago';
            return relTimeObj.start+'-ago';
        }

        var getTimeWindow = function(td, inEpoch) {
            if ( MetrilyxConfig.timeselector.enabled ) {
                var tmp = {};
                if(td.activeType === 'Relative') {
                    tmp.start = relativeTimeString(td.types.Relative);    
                } else {
                    if ( inEpoch ) {
                        // epoch 
                        tmp.start = td.types.Absolute.start.getTime()/1000;
                        tmp.end = td.types.Absolute.end.getTime()/1000;
                    } else {
                        // formatted string
                        tmp.start = formattedDateTime(td.types.Absolute.start);
                        tmp.end = formattedDateTime(td.types.Absolute.end);
                    }
                }       
                return tmp;
            }
            return {};
        }

        var setTimeWindow = function(td) {
            console.log(td);

            var tmp = $location.search();
            if(td.activeType === 'Relative' && tmp.end) delete tmp.end;

            $.extend(true, tmp, getTimeWindow(td), true);
            if(tmp.tags !== undefined && tmp.tags === '') delete tmp.tags;
            
            $location.search(tmp);
        }

        var getViewingWindow = function() {
            var active = timeDimension.types[timeDimension.activeType];
            if ( timeDimension.activeType == 'Relative' ) {
                //var relMatch = timeObj.start.match(/.*-ago$/); 
                var matches = (active.start+"-ago").match(REL_MATCH_REGEX);
                //console.log(matches);
                //if(relMatch) {
                    if(matches) {
                        //timeDimension.types.Relative.start = matches[1];
                        //timeDimension.activeType = 'Relative';
                        
                        //timeDimension.types.Absolute.end = new Date();
                        /* TODO: realtive time => set absolute*/
                        var f = parseFloat(matches[2]),
                            tw = {};
                        
                        switch(matches[3]) {
                        case "s":
                            tw.start = f * 1000;
                            break;
                        case "m":
                            tw.start = f * 60000;
                            break;
                        case "h":
                            tw.start = f * 3600000;
                            break;
                        case "d":
                            tw.start = f * 3600000 * 24;
                            break;
                        case "w":
                            tw.start = f * 3600000 * 24 * 7;
                            break;
                        default:
                            console.log("Invalid time unit");
                            break
                        }
                        tw.end = (new Date()).getTime();
                        tw.start = tw.end - tw.start;
                        return tw;
                    }
                //}
                console.log("failed matches");
            } else {
                return {
                    start: timeDimension.types.Absolute.start.getTime(),
                    end: timeDimension.types.Absolute.end.getTime()
                };
            }
        }

        var parseTime = function(timeObj) {
            if(timeObj.start !== '') {
                var relMatch = timeObj.start.match(/.*-ago$/); 
                var matches = timeObj.start.match(REL_MATCH_REGEX);
                //console.log(matches);
                if(relMatch) {
                    if(matches) {
                        timeDimension.types.Relative.start = matches[1];
                        timeDimension.activeType = 'Relative';
                        
                        timeDimension.types.Absolute.end = new Date();
                        /* TODO: realtive time => set absolute*/
                        var f = parseFloat(matches[2])

                        if(f != null) {
                            timeDimension.types.Absolute.start = new Date(
                                timeDimension.types.Absolute.end.getTime()-(f*3600000));
                            return true;
                        }
                    }
                    return false;
                } else {
                    // set absolute
                    timeDimension.types.Absolute.start = (moment($routeParams.start, DATE_TIME_FORMAT))._d;
                    timeDimension.activeType = 'Absolute';
                    if(timeObj.end) {
                        matches = timeObj.end.match(REL_MATCH_REGEX);
                        if(matches) {
                            console.info("Relative end time not supported yet!");
                            return false;
                        }
                        timeDimension.types.Absolute.end = (moment($routeParams.end, DATE_TIME_FORMAT))._d;
                    }

                }
            }
            return true;
        }

        var onRouteChangeSuccess = function(evt) {
            if($routeParams.start) {
                if(!parseTime($routeParams)) {
                    $rootScope.$emit('notification', {
                        title: 'Time window', 
                        message: 'Invalid time window: '+JSON.stringify($routeParams.start) 
                    });
                }
            } else {
                // set default if nothing provided
                timeDimension.activeType = 'Relative';
                timeDimension.types.Relative.start = DEFAULT_RELATIVE_START;
            }
            //console.log($routeParams);
            //scope.timeDimension = timeDimension;
        }

        return {
            /* to be set in controller */
            onRouteChangeSuccess: onRouteChangeSuccess,
            relativeTimeString: relativeTimeString,
            setTimeWindow: setTimeWindow,
            getTimeWindow: getTimeWindow,
            timeDimension: timeDimension,
            getViewingWindow: getViewingWindow
        };
    }
])
.directive('timeSelector', ['$rootScope', 'TimeWindowManager', function($rootScope, TimeWindowManager) {
    return {
        restrict: 'E',
        replace: false,
        templateUrl: 'app/timeselector/time-selector.html',
        link: function(scope, elem, attrs, ctrl) {


            var init = function() {
                scope.timeDimension = TimeWindowManager.timeDimension;
                
                scope.setTimeWindow = function() {
                    
                    TimeWindowManager.setTimeWindow(scope.timeDimension);
                }
            }

            init();
        }
    }
}])
.directive('relativeTimeSelector', ['TimeWindowManager', function(TimeWindowManager) {
    return {
        restrict: 'E',
        replace: false,
        templateUrl: 'app/timeselector/relative-time-selector.html',
        link: function(scope, elem, attrs, ctrl) {
            //if (!ctrl) return;

            //var widthScale = 100 / 168;
            var widthScale = 100/ 24;
            var relativeTimeScale = {
                '1h': widthScale,
                '2h': widthScale,
                '3h': widthScale,
                '6h': 3*widthScale,
                '12h': 6*widthScale,
                '1d': 12*widthScale,
                /*'1w': 100-48,*/
            };

            var setTimeWindow = function(val) {
                
                scope.timeDimension.types.Relative.start = val;

                console.log(scope.timeDimension);

                TimeWindowManager.setTimeWindow(scope.timeDimension);
            }

            var init = function() {
                
                scope.setTimeWindow = setTimeWindow;

                scope.relativeTimeScale = relativeTimeScale;
            }

            init();
        }
    }
}])
.directive('timeRangeSelector', ['TimeWindowManager', function(TimeWindowManager) {
    return {
        restrict: 'E',
        replace: false,
        templateUrl: 'app/timeselector/time-range-selector.html',
        link: function(scope, elem, attrs, ctrl) {
            //if (!ctrl) return;


            var setTimeWindow = function() {
                //scope.$apply(function() {
                //if ( scope.timeDimension.activeType == 'Relative' )
                //scope.timeDimension.types.Relative.start = val;
                //});
                //console.log(scope.timeDimension);
                TimeWindowManager.setTimeWindow(scope.timeDimension);
            }

            var init = function() {
                scope.setTimeWindow = setTimeWindow;
            }

            init();
        }
    }
}])
.controller('timeSelectorController', ['$rootScope', '$scope', '$routeParams', 'MetrilyxConfig', 'TimeWindowManager',
    function($rootScope, $scope, $routeParams, MetrilyxConfig, TimeWindowManager) {

        $scope.timeselectorEnabled = MetrilyxConfig.timeselector.enabled;
        $scope.selectedTimeRange = MetrilyxConfig.timeselector.defaultTimeWindow;
        //console.log($routeParams);
        $scope.$on('$routeChangeSuccess', TimeWindowManager.onRouteChangeSuccess);
    }
]);

