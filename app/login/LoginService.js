angular.module('login')
.factory('Authenticator', [
    '$window', '$http', '$location', '$rootScope', 
    function($window, $http, $location, $rootScope) {

        function _sessionIsAuthenticated() {
            if($window.sessionStorage['credentials']) {

                var creds = JSON.parse($window.sessionStorage['credentials']);
                if(creds.username && creds.username !== "" && creds.password && creds.password !== "") {
                    //
                    // do custom checking here
                    //
                    /* just return true for now */
                    return true
                }
            }
            return false;
        }

        function getCreds() {
            if($window.sessionStorage['credentials']) {
                return JSON.parse($window.sessionStorage['credentials']);
            }
            return null;
        }

        function _login(creds) {
            // do actual auth here //
            if(creds.username === "guest" && creds.password === "guest") {
                $window.sessionStorage['credentials'] = JSON.stringify(creds);
                $rootScope.$broadcast('auth:user:success', {username: creds.username});
                return true;
            }
            return false;
        }

        function _logout() {
            var creds = getCreds();
            var sStor = $window.sessionStorage;
            if(sStor['credentials']) {
                delete sStor['credentials'];
            }

            if ( creds !== null) {
                $rootScope.$broadcast('deauth:user:success', {username: creds.username});
            }
            $location.url("/login");
        }

        function checkAuthOrRedirect(redirectTo) {
            /* uncomment to skip auth */
            //return;
            if(!_sessionIsAuthenticated()) {

                $location.url("/login?redirect="+$location.url());
            }
        }

        var Authenticator = {
            login                 : _login,
            logout                : _logout,
            sessionIsAuthenticated: _sessionIsAuthenticated,
            checkAuthOrRedirect   : checkAuthOrRedirect
        };

        return (Authenticator);
    }
])
.factory('HTTPBasicAuth', ['$http', function ($http) {
    return {
        setCredentials: function (username, password) {
            $http.defaults.headers.common.Authorization = 'Basic ' + btoa(username + ':' + password);
        },
        clearCredentials: function () {
            delete $http.defaults.headers.common.Authorization;
        },
        authHeaders: function(username, password) {
            return {'Authorization': 'Basic ' + btoa(username + ':' + password)}
        }
    };
}]);