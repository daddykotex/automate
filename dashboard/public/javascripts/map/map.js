angular
  .module('automate.dashboard')
  .directive('map', function() {
    return {
      restrict: 'E',
      templateUrl: '/javascripts/map/map.html',
      replace: true,
      controller: 'MapCtrl',
      scope: {},
      controllerAs: 'vm',
      bindToController: true,
      link: function(scope, element, attrs, ctrl) {
        ctrl.init();
      }
    };
  })
  .controller('MapCtrl', function($rootScope, $scope, $uibModal, google, mapService) {
    var vm = this;

    vm.addSnowButton = function() {
      function CenterControl(controlDiv) {

        // Set CSS for the control border.
        var controlUI = document.createElement('div');
        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '22px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Click to recenter the map';
        controlDiv.appendChild(controlUI);

        var button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.style.cursor = 'pointer';
        button.innerHTML = 'Create new snow plow alert';
        controlUI.appendChild(button);

        button.addEventListener('click', function() {
          console.log('YES');
          vm.showModal();
        });
      }

      var centerControlDiv = document.createElement('div');
      centerControlDiv.style.display = 'none';
      new CenterControl(centerControlDiv, vm.map);

      centerControlDiv.index = 1;

      vm.map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
      vm.mapControls = centerControlDiv;
    };

    vm.showModal = function() {
      var modalInstance = $uibModal.open({
        animation: $scope.animationsEnabled,
        templateUrl: '/javascripts/scheduler/modal.html',
        controller: 'ModalInstanceCtrl',
      });

      modalInstance.result.then(function() {
        console.log('success');
        mapService.selected = {};
        vm.mapControls.style.display = 'none';
        $rootScope.$emit('automate.alert.snow');
      });
    };

    vm.init = function() {
      var lagare = new google.maps.LatLng(45.5155694, -73.5948246);

      vm.map = new google.maps.Map(document.getElementById('map'), {
        center: lagare,
        zoom: 13
      });

      vm.addSnowButton();

      vm.mapService = mapService;

      mapService.getParkingList().then(function(parkings) {
        vm.refreshParkings(parkings);
      });

      $scope.$watch('vm.mapService.parkings', function(parkings) {
        vm.refreshParkings(parkings);
      });
    };

    vm.refreshParkings = function(parkings) {
      if (!parkings) { return; }

      parkings.forEach(function(p) {
        var marker = mapService.markers[p.parkingId];

        if (!marker) {
          marker = new google.maps.Marker({
            position: {
              lat: p.parkingLocation.lat,
              lng: p.parkingLocation.long,
            },
            map: vm.map,
            title: p.parkingId.toString()
          });
          marker.addListener('click', function() {
            vm.toggleParkingSelection(p, marker);
            $rootScope.$apply();
          });
          mapService.markers[p.parkingId] = marker;
        }

        if (!mapService.selected[p.parkingId]) {
          mapService.setIconForMarker(p, marker);
        }
      });
    };

    vm.toggleParkingSelection = function(parking, marker) {
      var selected = mapService.selected;
      var id = parking.parkingId;

      if (!selected[id]) {
        selected[id] = parking;
        marker.setIcon('/images/markers/blue.png');
      } else {
        delete selected[id];
        mapService.setIconForMarker(parking, marker);
      }

      if (Object.keys(selected).length) {
        vm.mapControls.style.display = 'block';
      } else {
        vm.mapControls.style.display = 'none';
      }
    };
  })
  .service('mapService', function($http, $q) {
    this.selected = {};
    this.markers = {};

    this.getParkingList = function(force) {
      var self = this;

      if (!self.parkings || force) {
        return $http.get('http://localhost:3001/parking/listStates').then(function(response) {
          self.parkings = response.data;
          return self.parkings;
        });
      } else {
        var deferred = $q.defer();

        deferred.resolve(self.parkings);

        return deferred.promise;
      }
    };

    this.getAvailableParkings = function() {
      return this.parkings.filter(function(p) {
        return p.physicalAvailability === true;
      })
    };

    this.isSurge = function() {
      var available = this.getAvailableParkings();

      if (!this.parkings.length) {
        return false;
      }

      return (available.length / this.parkings.length) <= 0.4;
    };

    this.isLow = function() {
      var available = this.getAvailableParkings();

      if (!this.parkings.length) {
        return false;
      }

      return (available.length / this.parkings.length) >= 0.6;
    };

    this.calculateParkingPrice = function(parking) {
      var price = parking.pricingInfo.basePrice;
      var deltap = parking.pricingInfo.surgePriceIncrease;
      var deltam = parking.pricingInfo.declinePriceDecrease;

      if (this.isSurge()) {
        price += deltap;
      } else if (this.isLow()) {
        price -= deltam;
      }

      return price;
    };

    this.setIconForMarker = function(parking, marker) {
      var color = parking.physicalAvailability ? 'green' : 'red';
      var marker = this.markers[parking.parkingId];

      if (marker) {
        marker.setIcon('/images/markers/' + color + '.png');
      }
    };
  });
