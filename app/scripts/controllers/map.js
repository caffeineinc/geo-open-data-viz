'use strict';

angular.module('mapManagerApp')
  /**
   * @ngdoc function
   * @name mapManagerApp.controller:MapCtrl
   * @description
   * # MainCtrl
   * Controller of the mapManagerApp
   */
  .controller('MapCtrl', function($scope, $modal, currentMapService, layerService, //
                                  projectionService, consoleService, //
                                  mapCreatorService, map, maps, sources, //
                                  commonsService, toaster) {

    // Register common functions
    commonsService.registerCommonFunctionsInScope(
      $scope, $modal, 'map', maps, sources);

    // Set current map elements
    currentMapService.setCurrentMap(map);

    currentMapService.getCurrentMapContext().properties = {
      scale: map.scale,
      center: {
        lon: map.center.lon,
        lat: map.center.lat
      }
    };

    // Set current map in scope
    commonsService.setCurrentMapInScope($scope, map);

    // Add map functions in scope
    commonsService.registerCommonMapFunctionsInScope($scope);

    // Modals
    $scope.openAddLayerDialog = function($event) {
      // See bug on backgrop:
      // https://github.com/angular-ui/bootstrap/issues/3620
      var modalInstance = $modal.open({
        animation: false,
        templateUrl: 'views/modals/add-layer-modal.html',
        controller: 'AddLayerCtrl'
      });

      modalInstance.result.then(function(selectedItem) {
        $scope.selected = selectedItem;
        console.log('end');
      }, function() {
        // $log.info('Modal dismissed at: ' + new Date());
        console.log('Modal dismissed at: ' + new Date());
      });

      $event.stopPropagation();
    };

    // Modals
    $scope.openImportSourceDialog = function($event) {
      // See bug on backgrop:
      // https://github.com/angular-ui/bootstrap/issues/3620
      var modalInstance = $modal.open({
        animation: false,
        templateUrl: 'views/modals/import-source-modal.html',
        controller: 'ImportSourceCtrl',
        resolve: {
          sources: function() {
            return sources;
          }
        }
      });

      modalInstance.result.then(function(selectedSource) {
        console.log('>> $scope.linkedSources = '+$scope.linkedSources);
        if ($scope.linkedSources == null) {
          $scope.linkedSources = [];
        }
        console.log('>> $scope.linkedSources = '+$scope.linkedSources);
        console.log('>> selectedsource = '+JSON.stringify(selectedSource))
        $scope.linkedSources.push(selectedSource);

        toaster.pop('success', 'Map "' +
          currentMapService.currentMap.name + '"',
          'Successfully imported source');
      }, function() {
        // $log.info('Modal dismissed at: ' + new Date());
        console.log('Modal dismissed at: ' + new Date());
      });

      $event.stopPropagation();
    };
  })

  /**
   * @ngdoc function
   * @name mapManagerApp.controller:AddMapCtrl
   * @description
   * # MainCtrl
   * Controller of the mapManagerApp
   */
  .controller('AddMapCtrl', function($scope, $modalInstance, commonsService) {
    commonsService.registerCommonPanelFunctionsInScope($scope);

    $scope.mapToAdd = { type: 'd3' };

    $scope.addMap = function() {
      $modalInstance.close($scope.mapToAdd);
    };

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  })

  /**
   * @ngdoc function
   * @name mapManagerApp.controller:AddSourceCtrl
   * @description
   * # MainCtrl
   * Controller of the mapManagerApp
   */
  .controller('AddSourceCtrl', function($scope,
      $modalInstance, commonsService, topojsonService) {
    commonsService.registerCommonPanelFunctionsInScope($scope);

    $scope.shouldDisplaySample = function() {
      return ($scope.sourceToAdd.type === 'data');
    };

    $scope.sourceToAdd = { name: 'test', type: 'data' };

    $scope.$watch('sourceToAdd.url', function(newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }

      if (_.endsWith(newValue, '.tsv')) {
        $scope.sourceToAdd.dataType = 'tsv';
      } else if (_.endsWith(newValue, '.csv')) {
        $scope.sourceToAdd.dataType = 'csv';
      } else if (_.endsWith(newValue, '.json')) {
        $scope.sourceToAdd.dataType = 'json';
      }
    });

    $scope.loadData = function() {
      var loadFct = null;
      if ($scope.sourceToAdd.dataType === 'json') {
        loadFct = d3.json;
      } else if ($scope.sourceToAdd.dataType === 'csv') {
        loadFct = d3.csv;
      } else if ($scope.sourceToAdd.dataType === 'tsv') {
        loadFct = d3.tsv;
      }

      if (loadFct != null) {
        loadFct($scope.sourceToAdd.url, function(data) {
          if ($scope.sourceToAdd.type === 'data') {
            var structure = [];
            if (!_.isEmpty(data)) {
              for (var elt in data[0]) {
                structure.push(elt);
              }
            }
            $scope.sourceToAdd.structure = JSON.stringify(structure, null, 2);
            $scope.sourceToAdd.rowNumber = data.length;

            var sample = _.slice(data, 0, 5);
            $scope.sourceToAdd.sample = JSON.stringify(sample, null, 2);
          } else if ($scope.sourceToAdd.type === 'map') {
            console.log('>> $scope.sourceToAdd.type === map');
            topojsonService.transformTopojson(data);
            $scope.sourceToAdd.structure = JSON.stringify(data, null, 2);
          }
        });
      }
    };

    $scope.addSource = function() {
      $modalInstance.close($scope.sourceToAdd);
    };

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  })

  /**
   * @ngdoc function
   * @name mapManagerApp.controller:UpdatePropertiesCtrl
   * @description
   * # MainCtrl
   * Controller of the mapManagerApp
   */
  .controller('UpdatePropertiesCtrl', function($scope, commonsService) {
    commonsService.registerCommonPanelFunctionsInScope($scope, 'initial');
  })

  /**
   * @ngdoc function
   * @name mapManagerApp.controller:UpdateLayerCtrl
   * @description
   * # MainCtrl
   * Controller of the mapManagerApp
   */
  .controller('UpdateLayerCtrl', function($scope, commonsService) {
    commonsService.registerCommonPanelFunctionsInScope($scope);
    commonsService.registerCommonMapLayerFunctionsInScope($scope);
    commonsService.registerCommonMapLayerPanelFunctionsInScope($scope);

    if (!_.isNull($scope.layer.display) &&
        !_.isUndefined($scope.layer.display) &&
        !_.isNull($scope.layer.display.shape) &&
        !_.isUndefined($scope.layer.display.shape)) {
      $scope.properties.fillMode = (_.isNull($scope.layer.display.shape.threshold) ||
        _.isUndefined($scope.layer.display.shape.threshold)) ? 'static' : 'threshold';

      $scope.selectBrewColors = function(item, isReverse) {
        $scope.layer.display.shape.threshold.paletteCode = item.name;
        $scope.layer.display.shape.threshold.paletteReverse = isReverse;
        $scope.layer.display.shape.threshold.colors = item.colors;
      };
    }
  })

  /**
   * @ngdoc function
   * @name mapManagerApp.controller:AddLayerCtrl
   * @description
   * # MainCtrl
   * Controller of the mapManagerApp
   */
  .controller('AddLayerCtrl', function($scope, $modalInstance, commonsService) {
    commonsService.registerCommonPanelFunctionsInScope($scope);
    commonsService.registerCommonMapLayerPanelFunctionsInScope($scope);

    $scope.layerToAdd = {};

    $scope.addLayer = function() {
      $modalInstance.close(/*$scope.selected.item*/);
    };

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };

    $scope.$watch('layerToAdd.type', function(newValue, oldValue) {
      if (oldValue === newValue) {
        return;
      }

      if (newValue === 'data') {
        $scope.displayLayerMode();
      } else {
        $scope.hideLayerMode();
      }
    });
  })

  /**
   * @ngdoc function
   * @name mapManagerApp.controller:ImportSourceCtrl
   * @description
   * # MainCtrl
   * Controller of the mapManagerApp
   */
  .controller('ImportSourceCtrl', function($scope,
      $modalInstance, commonsService, sources) {
    commonsService.registerCommonPanelFunctionsInScope($scope);
    commonsService.registerCommonMapSourcePanelFunctionsInScope($scope);

    $scope.layerToAdd = {};
    $scope.sources = sources;
    $scope.preview = { enabled: false };
    $scope.selectedSource = { id: ''};
    $scope.sourcePreview = {};

    $scope.$watch('selectedSource.id', function(newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }

      $scope.sourcePreview = _.find(sources, 'id', newValue);
    });

    $scope.shouldDisplaySourcePreview = function() {
      return $scope.preview.enabled;
    };

    $scope.importSource = function() {
      $scope.sourcePreview = _.find(sources, 'id', $scope.selectedSource.id);
      $modalInstance.close($scope.sourcePreview);
    };

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  })

  /**
   * @ngdoc function
   * @name mapManagerApp.controller:UpdateSourceCtrl
   * @description
   * # MainCtrl
   * Controller of the mapManagerApp
   */
  .controller('UpdateSourceCtrl', function($scope, commonsService) {
    commonsService.registerCommonPanelFunctionsInScope($scope, 'preview');
  });