(function () {
	angular
		.module("common-controllers", [])
		.config([
			"$routeProvider",
			"$locationProvider",
			function ($routeProvider, $locationProvider) {
				$routeProvider
					.when("/profile", {
						templateUrl: "/templates/profile.html",
						controller: "ProfileController",
						controllerAs: "profile",
					})
					.when("/signup", {
						templateUrl: "/templates/signup.html",
						controller: "SignUpController",
						controllerAs: "signUp",
						caseInsensitiveMatch: true,
					})
					.when("/login", {
						templateUrl: "/templates/login.html",
						controller: "LoginController",
						controllerAs: "login",
						caseInsensitiveMatch: true,
					})
					.when("/view-hotel/:id", {
						templateUrl: "/templates/hotel.html",
						controller: "HotelController",
						controllerAs: "hotel",
					})
					.when("/admin", {
						templateUrl: "/templates/admin.html",
						controller: "AdminController",
						controllerAs: "admin",
						resolve: {
							validate: function ($q, $location, SessionService) {
								var validateAccess = $q.defer();
								var isAllowed = SessionService.isAdmin;

								if (!isAllowed) {
									$location.path("/profile");
								}

								validateAccess.resolve();
								return validateAccess.promise;
							},
						},
					})
					.otherwise({
						templateUrl: "/templates/landing.html",
						controller: "IndexController",
						controllerAs: "index",
					});
				$locationProvider.html5Mode(true);
			},
		])
		.controller("IndexController", [
			"$scope",
			"$window",
			"SessionService",
			function ($scope, $window, sessionService) {
				$scope.session = sessionService;
				sessionService.authSuccess($window.user);
				$scope.logout = function () {
					sessionService.logout();
				};
			},
		])
		.controller("LoginController", [
			"$scope",
			"$location",
			"SessionService",
			"growl",
			function ($scope, $location, sessionService, growl) {
				$scope.login = function () {
					sessionService.login(this.email, this.password).then(function (data) {
						if (!data.error) {
							sessionService.authSuccess(data);
							if (data.isAdmin) {
								$location.path("/admin");
							} else {
								$location.path("/profile");
							}
						} else {
							growl.addErrorMessage(data.error);
						}
					});
				};
			},
		])
		.controller("SignUpController", [
			"$scope",
			"UserService",
			function ($scope, userService) {
				$scope.signUp = function () {
					var user = {
						email: this.email,
						password: this.password,
						firstName: this.firstName,
						lastName: this.lastName,
					};
					userService.create(user).then(function (data) {});
				};
			},
		])
		.controller("AdminController", [
			"$scope",
			"$location",
			"HotelService",
			"UserService",
			function ($scope, $location, hotelService, userService) {
				$scope.hotels = {};
				$scope.users = {};
				$scope.newHotel = {};

				$scope.init = function () {
					$scope.newHotel = {};
					userService.get().then(function (data) {
						$scope.users = data;
					});
					hotelService.get().then(function (data) {
						$scope.hotels = data;
					});
				};

				$scope.createHotel = function () {
					$scope.hotelForm.submitAttempt = true;
					if ($scope.hotelForm.$valid) {
						$scope.addHotel = false;
						hotelService.create($scope.newHotel);
						$scope.init();
					}
				};

				$scope.deleteUser = function (id) {
					userService.delete(id).then(function () {
						$scope.init();
					});
				};

				$scope.deleteHotel = function (id) {
					hotelService.delete(id).then(function () {
						$scope.init();
					});
				};
			},
		])
		.controller("ProfileController", [
			"$scope",
			"HotelService",
			"UserService",
			"SessionService",
			"BookingService",
			function ($scope, hotelService, userService, sessionService, bookingService) {
				$scope.hotels = {};
				$scope.bookings = {};
				$scope.term = hotelService.term;

				$scope.getById = function (arr, id) {
					for (var d = 0, len = arr.length; d < len; d += 1) {
						if (arr[d]._id === id) {
							return arr[d];
						}
					}
				};

				$scope.init = function () {
					bookingService.get().then(function (data) {
						var bookings = data;
						if (bookings) {
							hotelService.get().then(function (dataHotels) {
								for (var i = 0; i < bookings.length; i += 1) {
									var booking = bookings[i];
									bookings[i].hotel = $scope.getById(dataHotels, booking.hotel);
								}
								$scope.bookings = bookings;
							});
						}
					});
				};

				$scope.searchHotels = function () {
					hotelService.search(this.term).then(function (data) {
						if (data.length > 0) {
							$scope.hotels = data;
							hotelService.term = $scope.term;
						}
					});
				};

				$scope.cancelBooking = function (id) {
					bookingService.delete(id).then(function (data) {
						$scope.init();
					});
				};
			},
		])
		.controller("HotelController", [
			"$scope",
			"$locale",
			"$location",
			"HotelService",
			"BookingService",
			function ($scope, $locale, $location, hotelService, bookingService) {
				$scope.booking = { type: undefined };
				$scope.currentYear = new Date().getFullYear();
				$scope.currentMonth = new Date().getMonth() + 1;
				$scope.months = $locale.DATETIME_FORMATS.MONTH;

				$scope.options = [
					{
						name: "Single Bed",
						type: "Basic",
					},
					{
						name: "Double Bed",
						type: "Basic",
					},
					{
						name: "Double Bed",
						type: "Deluxe",
					},
				];

				$scope.$on("$routeChangeSuccess", function (event, current, previous) {
					$scope.init(current.pathParams.id);
					event.preventDefault();
				});

				$scope.init = function (hotelId) {
					hotelService.getHotel(hotelId).then(function (data) {
						$scope.hotel = data;
					});
				};

				$scope.bookHotel = function () {
					var newBooking = {
						month: $scope.booking.month,
						year: $scope.booking.year,
						roomType: $scope.booking.roomType.type,
						creditCard: $scope.booking.creditCard,
						securityCode: $scope.booking.securityCode,
						checkOutDate: $scope.booking.checkOutDate,
						checkInDate: $scope.booking.checkInDate,
						creditCardName: $scope.booking.creditCardName,
						hotel: $scope.hotel,
					};
					bookingService.create(newBooking).then(function (data) {});
				};

				$scope.backToSearch = function () {
					$location.path("/profile");
				};

				$scope.proceed = function () {
					if ($scope.paymentForm.$valid) {
						$scope.confirmBooking = true;
					}
				};
			},
		]);
})();
