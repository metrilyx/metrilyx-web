angular.module('metrilyx.autocomplete', [])
.directive('autocomplete', ['OpenTsdbSearch', function(OpenTsdbSearch) {
    return {
        restrict: 'A',
        scope: {
            searchType: '=',
            providerName: '=',
            ngModel: '=',
        },
        link: function(scope, elem, attrs) {

            var sourceFunc, selectFunc;

            var focusFunc = function(evt, ui) {
                //console.log(ui.item.value);
                evt.preventDefault();
            }

            var tagFocusFunc = function(event, ui) {
                var tagkvs = elem.val().split(',');
                var kv = tagkvs.splice(tagkvs.length-1, 1)[0].split('=');

                if(kv.length == 1) {
                    
                    if (tagkvs.length > 0)
                        elem.val(tagkvs.join(',') + ',' + ui.item.value);
                    else
                        elem.val(ui.item.value);
                    return false;
                
                } else if(kv.length == 2) {
                    
                    var tvals = kv[1].split("|");
                    var retstr = "";
                    for(var i=0; i < tvals.length-1; i++) {
                        retstr += tvals[i]+"|";
                    }
                    retstr += ui.item.value;

                    //scope.$apply(function() { scope.ngModel[kv[0]] = retstr; });
                    tagkvs.push(kv[0]+'='+retstr);
                    elem.val(tagkvs.join(','));

                    event.preventDefault();
                }
            }

            var tagSelectFunc = function( event, ui ) {
                var tagkvs = elem.val().split(',');
                var kv = tagkvs.splice(tagkvs.length-1, 1)[0].split('=');

                if(kv.length == 1) {
                    if (tagkvs.length > 0)
                        elem.val(tagkvs.join(',') + ',' + ui.item.value+'=');
                    else
                        elem.val(ui.item.value+'=');
                    
                    event.preventDefault();
                
                } else if(kv.length == 2) {
                    
                    var tvals = kv[1].split("|");
                    var retstr = "";
                    for(var i=0; i < tvals.length-1; i++) {
                        retstr += tvals[i]+"|";
                    }
                    retstr += ui.item.value;

                    scope.$apply(function() { scope.ngModel[kv[0]] = retstr; });    

                    //tagkvs.push(kv[0]+'='+retstr);
                    //elem.val(tagkvs.join(','));

                    event.preventDefault();
                }
            };

            switch(scope.searchType) {
                case "opentsdb:metrics":
                    sourceFunc = function(request, response) {
                        OpenTsdbSearch.suggest(scope.providerName, "metrics", elem.val(), function(rslt) {
                            response(rslt);
                        });
                    }
                    selectFunc = function(event, ui) {
                        scope.$apply(function() { scope.ngModel = ui.item.value; });
                    }
                    break;
                case "opentsdb:tags":
                    sourceFunc = function(request, response) {
                        var tagkvs = request.term.split(',');
                        var tkv = tagkvs[tagkvs.length-1].split('=');
                        //var tkv = request.term.split('=');
                        if (tkv.length == 1) {
                            //tagk
                            OpenTsdbSearch.suggest(scope.providerName, "tagk", tkv[0], function(rslt) {
                                response(rslt);
                            });
                        } else if (tkv.length == 2) {
                            var vs = tkv[1].split('|');
                            if ( vs.length == 1 ) {
                                OpenTsdbSearch.suggest(scope.providerName, "tagv", tkv[1], function(rslt) {
                                    response(rslt);
                                });
                            } else {
                                OpenTsdbSearch.suggest(scope.providerName, "tagv", vs[vs.length-1], function(rslt) {
                                    response(rslt);
                                });
                            }
                        }
                    }
                    selectFunc = tagSelectFunc;
                    focusFunc = tagFocusFunc;
                    break;
                default:
                    break;
            }

            if ( sourceFunc ) {
                elem.autocomplete({
                    source: sourceFunc,
                    select: selectFunc,
                    messages: { noResult: '', results: function() {}},
                    focus: focusFunc               
                });
            } else {
                console.warn('Search not enabled for provider:', providerName);
            }

        }
    }
}])