angular.module('dashboard')
.directive('copyPane', ['$rootScope', 'Schema', function($rootScope, Schema) {
    return {
        restrict: 'E',
        scope: {
            contentId: '@',
            copyableList: '=',
            label: '=',
            copyType: '='
        },
        templateUrl: 'app/copier/copier.html',
        link: function(scope, elem, attrs) {

            var _copies = [];

            /* Get new id's for copied items. */
            var _getNewId = function(idx, dsType) {
                var schemaType = scope.copyType;
                if ( scope.copyType == 'datasource' ) {
                    schemaType += '/' + dsType;
                }

                Schema.get({schemaType: schemaType}, function(rslt) {
                    _copies[idx].id = rslt.id;
                });
            }

            var copySelectedItems = function() {
                
                _copies = [];
                
                for ( var i=0; i < scope.copyableList.length; i++ ) {
                    if ( scope.copyableList[i].$selected &&  scope.copyableList[i].$selected == true) {
                        _copies.push(angular.copy(scope.copyableList[i]));
                    }
                }

                if ( scope.copyType == 'datasource' ) {
                    for ( var i=0; i < _copies.length; i++ ) {
                        _getNewId(i, _copies[i].type);
                    }
                } else {
                        for ( var i=0; i < _copies.length; i++ ) {
                        _getNewId(i);
                    }
                }


                if ( _copies.length > 0 ) {
                    $rootScope.$broadcast("copy:initiate", {type: scope.copyType, list: _copies});
                } else {
                    $rootScope.$broadcast('notification', 
                        {title: 'Cannot copy', message: 'No items selected'});
                }
            }

            /*
            var copySelectedItems = function() {
                
                _copies = [];
                
                for ( var i=0; i < scope.selectedList.length; i++ ) {
                    if ( scope.selectedList[i] ) {
                        _copies.push(angular.copy(scope.copyableList[i]));
                    }
                }

                if ( scope.copyType == 'datasource' ) {
                    for ( var i=0; i < _copies.length; i++ ) {
                        _getNewId(i, _copies[i].type);
                    }
                } else {
                        for ( var i=0; i < _copies.length; i++ ) {
                        _getNewId(i);
                    }
                }


                if ( _copies.length > 0 ) {
                    $rootScope.$broadcast("copy:initiate", {type: scope.copyType, list: _copies});
                } else {
                    $rootScope.$broadcast('notification', 
                        {title: 'Cannot copy', message: 'No items selected'});
                }
            }
            */
            var initSelectedList = function() {

                var selectedList = [];
                for( var i=0; i < scope.copyableList.length; i++ ) {
                    selectedList.push(false);
                }
                
                scope.selectedList = selectedList;
            }

            var init = function() {
                //initSelectedList();
                
                scope.copySelectedItems = copySelectedItems;
            }

            init();
        }
    };
}])/*
.directive('datasourceCopier', [function() {
    return {
        restrict: 'E',
        scope: {},
        link: function(scope, elem, attrs) {

        }
    };
}])*/
.directive('copyList', ['$rootScope', function($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/copier/copy-list.html',
        link: function(scope, elem, attrs) {

            var _started = false;

            var onMouseMove = function(evt) {
                //console.log(evt);
                elem.css('left', evt.x+10);
                elem.css('top', evt.y+10);
            }

            var cleanUp = function() {
                document.removeEventListener("mousemove", onMouseMove);
                elem.hide();
                document.removeEventListener("keyup", onEscPressed);
                //console.log('cancelled');
                _started = false;
                scope.copying = [];
            }

            var onEscPressed = function(e) {
                if (e.keyCode == 27) {
                    cleanUp();
                    $rootScope.$broadcast("copy:complete", {});
                }
            }

            var onCopyInitiate = function(e, d) {

                scope.copying = d.list;
                scope.copyType = d.type;

                elem.show();

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('keyup', onEscPressed);
            }

            var init = function() {
                $rootScope.$on('copy:initiate', onCopyInitiate);
                $rootScope.$on("copy:complete", cleanUp);
            }

            init();
        }
    };
}])
.filter('copyItemLabel', function() {
    return function(obj) {
        if ( obj.name && obj.name !== '') {
            return obj.name + ' (' + obj.id + ')';
        }
        return obj.id;
    }
});