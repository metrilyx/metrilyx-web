angular.module('annotations', [])
.factory('AnnoTypesSvc', ['$resource', 'MetrilyxConfig',
    function($resource, MetrilyxConfig) {
        return $resource(MetrilyxConfig.annotations.endpoints.types+'/:typeId', {}, {
            listTypes: {
                method : 'GET',
                isArray: true
            }
        });
    }
])
.factory('AnnoSvc', ['$resource', 'MetrilyxConfig',
    function($resource, MetrilyxConfig) {
        return $resource(MetrilyxConfig.annotations.endpoints.annotations , {}, {
            search: {
                method: 'GET',
                isArray: true
            }
        });
    }
])
.factory("AnnotationsManager", [
    '$location', '$routeParams', '$rootScope', 'AnnoTypesSvc',
    function($location, $routeParams, $rootScope, AnnoTypesSvc) {

        var AnnotationsManager = function(scope) {
            
            var t = this;

            function applyAnnotations(annotations) {
                if(!annotations.tags || !annotations.types) {

                    $rootScope.$emit('notification', {title: 'Annotation error', message: 'Tags or type missing'})
                    return;
                }

                var urlparams = {
                    annotags: tags2String(annotations.tags),
                    annotypes: annotations.types.join(",")
                };
                if(urlparams.annotypes === '' || urlparams.annotags === '') {

                    $rootScope.$emit('notification', {title: 'Annotation error', message: 'Tags or type missing'})
                } else {

                    var tmp = $location.search();
                    $.extend(true, tmp, urlparams, true);
                    $location.search(tmp);
                }
            }

            function _parseRouteParams() {
                var annotations = {
                    tags: {},
                    types: [],
                }
                if($routeParams.annotypes && $routeParams.annotags){
                    var types = $routeParams.annotypes.split(",");
                    if(types.length < 1) {
                        
                        $rootScope.$emit('notification', 
                            {title: 'Annotation error', message: 'Type missing (length 0)!'})
                    }

                    var tagmap = string2Tags($routeParams.annotags);
                    if(tagmap.error !== undefined) {

                        $rootScope.$emit('notification', {title: 'Annotation tag error', message: tagmap.error})
                    } else {

                        annotations.types = types;
                        annotations.tags = tagmap;
                    }
                } else if($routeParams.annotypes && !$routeParams.annotags) {

                    $rootScope.$emit('notification', {title: 'Annotation tag error', message: 'Tag/s missing'})

                } else if(!$routeParams.annotypes && $routeParams.annotags) {

                    $rootScope.$emit('notification', {title: 'Annotation type error', message: 'Type/s missing'})
                }
                return annotations;
            }

            function _fetchEventAnnoTypes(cb) {

                AnnoTypesSvc.listTypes(function(rslt) {
                    var out = {};
                    for(var i=0; i<rslt.length;i++) {
                        rslt[i].selected = false;
                        out[rslt[i].id] = rslt[i];
                    }
                    cb(out);
                }, function(err) {
                    console.error(err);
                    if(err.status == 0) {
                        $rootScope.$emit('notification', 
                            {title: 'Annotation service failed', message: 'Failed to connect to annotation service!'});
                    } else {
                        $rootScope.$emit('notification', 
                            {title: 'Annotation type error', message: 'Failed to get annotation types: '+err});
                    }
                });
            }


            function _init() {
                
                scope.annoFilter = _parseRouteParams();
                
                _fetchEventAnnoTypes(function(d) {
                    for(var t=0;t<scope.annoFilter.types.length;t++) {
                        
                        if(d[scope.annoFilter.types[t]] !== undefined) 
                            d[scope.annoFilter.types[t]].selected = true;
                    }
                    scope.eventAnnoTypes = d;
                });

                t.applyAnnotations = applyAnnotations;
            }

            _init();    
        }

        return (AnnotationsManager);
    }
])
.directive('annotationsEditor', ['$rootScope', 'AnnotationsManager', 
    function($rootScope, AnnotationsManager) {
        return {
            restrict: 'E',
            templateUrl: 'app/annotations/annotations-editor.html',
            link: function(scope, elem, attrs, ctrl) {
            
                scope.eventAnnoTypes = {};
                scope.annoFilter = [];

                var annoMgr = new AnnotationsManager(scope);

                scope.applyAnnotations = function() {
                    var out = [];
                    for(var k in scope.eventAnnoTypes) {
                        if(scope.eventAnnoTypes[k].selected) 
                            out.push(k);
                    }
                    scope.annoFilter.types = out;
                    annoMgr.applyAnnotations(scope.annoFilter);
                }
                
                scope.deleteAnnotationTag = function(tagk) {
                    delete scope.annoFilter.tags[tagk];
                }

            }
        }
    }
]);