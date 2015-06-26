angular.module('globaltags', [])
.factory("GlobalTagsParser", [ '$location', '$rootScope', '$routeParams',
    function($location, $rootScope, $routeParams) {

        //var GlobalTagsParser = function(scope) {
        //    var t = this;

            var setGlobalTags = function(gtags) {
                var urlparams = { globaltags: tags2String(gtags) };

                var tmp = $location.search();
                if(urlparams.globaltags !== '') {
                    $.extend(true, tmp, urlparams, true);
                } else {
                    delete tmp.globaltags;
                }
                $location.search(tmp);
            }

            var getGlobalTags = function() {
                if($routeParams.globaltags) return string2Tags($routeParams.globaltags);
                return {};
            }
            /*
            function init() {
                console.log('GlobalTagsParser:init');

                //t.applyGlobalTags = applyGlobalTags;

                scope.$on('$routeChangeSuccess', function() {
                    scope.globalTags = parseGlobalTags();
                });
            }

            init();
            */
            return {
                getGlobalTags: getGlobalTags,
                setGlobalTags: setGlobalTags
            };
        //}
        //return (GlobalTagsParser);
    }
])
.directive('inlineGlobalTags', [function() {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;
            console.log(ctrl.modelValue);

            var model2view = function(modelVal) {
                console.log(modelVal);
                return tags2String(modelVal, '=');
            }

            var view2model = function(viewVal) {
                return string2Tags(viewVal, '=');
            }


            var init = function() {
                // model --> view
                ctrl.$formatters.push(model2view);
                // view --> model
                //ctrl.$parsers.unshift(view2model);
            }   

            init(); 
        }
    };
}])
.directive('globalTags', ['GlobalTagsParser', 
    function(GlobalTagsParser) {
        return {
            restrict: 'E',
            templateUrl: 'app/globaltags/global-tags.html',
            link: function(scope, elem, attrs, ctrl) {
                
                //var globalTagsParser;

                scope.globalTags = {};
                
                scope.applyGlobalTags = function() {
                    GlobalTagsParser.setGlobalTags(scope.globalTags);
                }

                scope.deleteGlobalTag = function(tagk) {
                    //console.log(tagk, scope.globalTags);
                    delete scope.globalTags[tagk];
                }

                var init = function() {
                    //globalTagsParser = new GlobalTagsParser(scope);
                    //console.log(scope.globalTags);
                    scope.$on('$routeChangeSuccess', function() {
                        scope.globalTags = GlobalTagsParser.getGlobalTags();
                    });
                }

                init();
            }
        }
    }
]);