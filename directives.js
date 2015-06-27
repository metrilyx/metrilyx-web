angular.module('appDirectives', [])
.directive('dashboardTags', ['$window', function($window) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if (!ctrl) return

            function model2View(modelValue) {
                if(modelValue) return modelValue.join(',');
                return '';
            }

            function view2Model(viewValue) {
                var arr = viewValue.split(',');
                var out = [];
                for(var i=0; i<arr.length;i++) {
                    if(arr[i] == '') continue;
                    out.push(arr[i]);
                }
                return out;
            }

            function init() {
                // model --> view
                ctrl.$formatters.push(model2View);
                // view --> model
                ctrl.$parsers.unshift(view2Model);
            }

            init();
        }
    }
}])
.directive('autoFillHeight', ['$window', function($window) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs, ctrl) {

            var jelem = $(elem[0]);

            function setHeightToWindowHeight() {
                jelem.height($window.innerHeight - jelem.position().top);
            }

            function _init() {
                setHeightToWindowHeight();

                $window.addEventListener('resize', function(evt) {
                    setHeightToWindowHeight();
                });
            }

            _init();
        }
    };
}])
.directive('inlineTags', ['GlobalTagsParser', function(GlobalTagsParser) {
    return {
        restrict: 'EA',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;

            var model2view = function(modelVal) {
                //console.log(modelVal);
                var str = tags2String(modelVal, '=');
                return str;
            }

            var view2model = function(viewVal) {
                var tags = string2Tags(viewVal, '=');
                if (tags.error) {
                    ctrl.$setValidity('inlineTags', false);
                    return ctrl.modelValue;
                } else {
                    ctrl.$setValidity('inlineTags', true);
                    return tags;
                }
            }


            var init = function() {
                // model --> view
                ctrl.$formatters.push(model2view);
                // view --> model
                ctrl.$parsers.unshift(view2model);
            }   

            init(); 
        }
    };
}])
.directive('tagKeyValue', [function() {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;

            elem[0].addEventListener('keyup', function(evt) {

                var kv = elem.val().split("=");
                if(kv.length == 2) {
                    if(kv[1] !== undefined && kv[1] !== '') {

                        if ( kv[1][kv[1].length-1] == '|' ) {
                            ctrl.$setValidity('tagkeyvalue', false);
                        } else {
                            ctrl.$setValidity('tagkeyvalue', true);    
                            scope.$apply(function() { ctrl.$modelValue[kv[0]] = kv[1]; });
                        }
                        
                        if( evt.keyCode == 13 ) elem.val('');
                        //elem[0].value = '';
                        //return;
                    }
                } else {
                    ctrl.$setValidity('tagkeyvalue', false);        
                }
            });

            // model 2 view
            ctrl.$formatters.push(function(modelValue) { return ""; });
            // view 2 model
            ctrl.$parsers.unshift(function(viewValue) { return ctrl.$modelValue; });
        }
    };
}])
.directive('jsonEditor', [ function() {
    'use strict';

    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if(!ctrl) return;
            
            var view2model = function(viewVal) {
                if ( viewVal == "" ) return {};
                try {
                    return JSON.parse(viewVal);
                } catch(e) {
                    return ctrl.$modelValue;
                }
            }

            var model2view = function(modelVal) {
                return angular.toJson(modelVal, true);
            }

            var init = function() {
                // model --> view
                ctrl.$formatters.push(model2view);
                // view --> model
                ctrl.$parsers.unshift(view2model);
            }   

            init(); 
        }
    }
}]);