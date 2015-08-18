'use strict';

angular.module('mapManager.utilities', [ ])

// Map creator service

/**
 * @ngdoc service
 * @name mapManager.utilities:valueChecker
 * @description
 * Provide functions to check values.
 */
.service('valueChecker', function() {
  return {
    /**
     * @ngdoc method
     * @name isNull
     * @methodOf mapManager.utilities:attributeChecker
     * @description
     * Check if a value is null or undefined.
     *
     * @param {Object} val the value to check
    */
    isNull: function(val) {
      return _.isUndefined(val) || _.isNull(val);
    },

    /**
     * @ngdoc method
     * @name isNull
     * @methodOf mapManager.utilities:attributeChecker
     * @description
     * Check if a value is null, undefined or empty.
     *
     * @param {Object} val the value to check
    */
    isNullOrEmpty: function(val) {
      return this.isNull(val) || _.isEmpty(val);
    },

    /**
     * @ngdoc method
     * @name isNotNull
     * @methodOf mapManager.utilities:attributeChecker
     * @description
     * Check if a value isn't null and undefined.
     *
     * @param {Object} val the value to check
    */
    isNotNull: function(val) {
      return !_.isUndefined(val) && !_.isNull(val);
    },

    /**
     * @ngdoc method
     * @name isNotNullAndNotEmpty
     * @methodOf mapManager.utilities:attributeChecker
     * @description
     * Check if a value isn't null, undefined and
     * not empty.
     *
     * @param {Object} val the value to check
    */
    isNotNullAndNotEmpty: function(val) {
      return this.isNotNull(val) && !_.isEmpty(val);
    }
  };
})

/**
 * @ngdoc service
 * @name mapManager.utilities:eventUtils
 * @description
 * Provide functions to check values.
 */
.service('eventUtils', [ 'valueChecker', function(valueChecker) {
  return {
    /**
     * @ngdoc method
     * @name getDomainEvents
     * @methodOf mapManager.d3.services:layerService
     * @description
     * Get events associated to a particular domain. Supported events are:
     *
     * * `display` to display elements of the domain
     * * `hide` to hide elements of the domain
     *
     * @param {Object} layer the layer
     * @param {Object} domain the domain
    */
    getDomainEvents: function(layer, domain) {
      var self = this;

      if (valueChecker.isNotNull(layer.behavior) &&
          valueChecker.isNotNull(layer.behavior.events)) {
        var domainEvents = {};

        _.forEach(layer.behavior.events, function(n, key) {
          if (!self.isSupportedEvent(key)) {
            return;
          }

          var event = layer.behavior.events[key];
          var eventHandlers = null;
          if (!_.isArray(event)) {
            eventHandlers = [ event ];
          } else {
            eventHandlers = event;
          }

          _.forEach(eventHandlers, function(eventHandler) {
            if (eventHandler.display === domain) {
              domainEvents.display = key;
            }
            if (eventHandler.hide === domain) {
              domainEvents.hide = key;
            }
          });
        });

        if (valueChecker.isNull(domainEvents.display) &&
            valueChecker.isNull(domainEvents.hide)) {
          return null;
        } else {
          return domainEvents;
        }
      }

      return null;
    },

    /**
     * @ngdoc method
     * @name isSupportedEvent
     * @methodOf mapManager.utilities:attributeChecker
     * @description
     * Check if the event type is correct and supported.
     *
     * Supported types are: `click`, `dblclick`, `mouseOver`,
     * and `mouseOut`.
     *
     * @param {Object} val the value to check
    */
    isSupportedEvent: function(eventType) {
      return (eventType === 'click' || eventType === 'dblclick' ||
        eventType === 'mouseover' || eventType === 'mouseout');
    }
  };
}])

/**
 * @ngdoc service
 * @name mapManager.utilities:eventUtils
 * @description
 * Provide functions to check values.
 */
.service('mapUtils', [ 'valueChecker', function(valueChecker) {
  return {
    createSubMapStructure: function(svg, mapId, dimensions, background) {
      return this.createMapStructure(svg, mapId, {
        dimensions: dimensions,
        background: background
      });
    },

    createMainMapStructure: function(svg) {
      return this.createMapStructure(svg, '1');
    },

    createMapStructure: function(svg, mapId, properties) {
      // Create element for the map
      var gMap = svg.append('g').attr('id', 'map' + mapId);

      // Create background
      if (valueChecker.isNotNull(properties) &&
        valueChecker.isNotNull(properties.dimensions) &&
        valueChecker.isNotNull(properties.background)) {
        gMap.append('rect')
            //.attr('class', 'background')
            .attr('width', properties.dimensions.width)
            .attr('height', properties.dimensions.height)
            .attr('id', 'rect' + mapId)
            .style('fill', properties.background.fill)
            .style('opacity', properties.background.opacity);
      }

      // Create element for layers
      var gLayers = gMap.append('g').attr('id', 'map' + mapId + '-layers');

      return { gMap: gMap, gLayers: gLayers };
    }
  };
}]);