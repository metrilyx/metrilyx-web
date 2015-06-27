angular.module('globaltags', [])
.factory("GlobalTagsParser", [ '$location', '$rootScope', '$routeParams',
    function($location, $rootScope, $routeParams) {

        var setGlobalTags = function(gtags) {
            var urlparams = { globaltags: tags2String(gtags, ':') };

            var tmp = $location.search();
            //console.log(tmp);
            if(urlparams.globaltags !== '') {
                $.extend(true, tmp, urlparams, true);
            } else {
                delete tmp.globaltags;
            }
            //console.log(tmp);
            $location.search(tmp);
        }

        var getGlobalTags = function() {
            if($routeParams.globaltags) return string2Tags($routeParams.globaltags, ':');
            return {};
        }

        return {
            getGlobalTags: getGlobalTags,
            setGlobalTags: setGlobalTags
        };
    }
])
.directive('onEnterApply', [function() {
    /* 
     * Apply global tags when user presses enter and the data is valid 
     */
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if (!ctrl) return;

            elem[0].addEventListener('keyup', function(e) {
                if (e.keyCode == 13 && ctrl.$valid) {
                    console.log('apply');
                    console.log(scope);
                    scope.$apply(function() { scope.applyGlobalTags(); });
                }
            });
        }
    };
}])
.directive('globalTags', ['GlobalTagsParser', 
    function(GlobalTagsParser) {
        return {
            restrict: 'E',
            templateUrl: 'app/globaltags/global-tags.html',
            link: function(scope, elem, attrs, ctrl) {

                scope.globalTags = {};
                
                scope.applyGlobalTags = function() {
                    //console.log('tags', scope.globalTags);
                    GlobalTagsParser.setGlobalTags(scope.globalTags);
                }

                scope.deleteGlobalTag = function(tagk) {
                    //console.log(tagk, scope.globalTags);
                    delete scope.globalTags[tagk];
                }

                var init = function() {
                    //scope.$on('$routeChangeSuccess', function() {
                    //    scope.globalTags = GlobalTagsParser.getGlobalTags();
                    //});
                    scope.globalTags = GlobalTagsParser.getGlobalTags();
                }

                init();
            }
        }
    }
]);