angular.module('login', [])
.controller('loginController', [
    '$scope', '$window', '$routeParams', '$location', 'Authenticator',
    function($scope, $window, $routeParams, $location, Authenticator) {

        var defaultPage = "/new";

        $scope.credentials = { username: "guest", password: "guest" };

        $scope.attemptLogin = function() {
            if(Authenticator.login($scope.credentials)) {

                if($routeParams.redirect) $location.url($routeParams.redirect);
                else $location.url(defaultPage);
            } else {

                $("#login-window-header").html("<span>Auth failed!</span>");
            }
        }

        function _initialize() {
            if($window.sessionStorage['credentials']) {

                var creds = JSON.parse($window.sessionStorage['credentials']);
                if(creds.username && creds.username !== "" && creds.password && creds.password !== "") {

                    $scope.credentials = creds;
                    $scope.attemptLogin();
                }
            }
        }

        _initialize();
    }
]);