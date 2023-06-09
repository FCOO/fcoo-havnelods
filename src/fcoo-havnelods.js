/****************************************************************************
	fcoo-havnelods.js,

	(c) 2021, FCOO

	https://github.com/FCOO/fcoo-havnelods
	https://github.com/FCOO

****************************************************************************/
(function ($, L, i18next, moment, window/*, document, undefined*/) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {};

    /**********************************************************************
    L.GeoJSON.Havnelods(options)
    Generel constructor for all variations
    ***********************************************************************/
    L.GeoJSON.Havnelods = L.GeoJSON.extend({
        //Default options
        options: {
            idName          : 'HAVNE_ID',
            subDir          : 'havnelods',
            fileName        : 'havnelods.json',
            images          : 'images',

            annotationId    : 'ANMERKNING',
            annotationClass : 'hl-annotation alert-info accordion-body accordion'
        },
        locationConstructor: null,



        /*********************************************
        initialize
        *********************************************/
        initialize: function(geojson, options = {}) {
            options = $.extend(true, {}, {
                pointToLayer: $.proxy(this.pointToLayer, this)
            }, options);

            L.GeoJSON.prototype.initialize.call(this, geojson, options);

            //Load and add geoJSON-data
            this.list = [];
            window.Promise.getJSON(
                ns.dataFilePath({mainDir: true, subDir: this.options.subDir, fileName: this.options.fileName}),
                {},
                $.proxy(this.resolve, this)
            );
        },

        /*********************************************
        resolve
        *********************************************/
        resolve: function(data){
            //data = []LOCATION
            var _this = this,
                geoJSONData = {
                    type    : "FeatureCollection",
                    features: []
                };

            this.list = [];
            data.forEach((options) => {
                /*TEST: Only Langebro
                if (options.BRO_ID != '7d17393b-3e61-4157-be25-b8861a78b9ad')
                    return false;
                //*/
                var location = new _this.locationConstructor(options, _this);
                location.index = _this.list.length;
                _this.list.push(location);

                if (location.latLng)
                    geoJSONData.features.push({
                        type      : "Feature",
                        geometry  : {type: "Point", coordinates: [location.latLng.lng, location.latLng.lat]},
                        properties: location
                    });
            });

            this.addData(geoJSONData);
        },

        /*********************************************
        pointToLayer
        *********************************************/
        pointToLayer: function(geoJSONPoint){
            return geoJSONPoint.properties.createMarker();
        },
    });

    /**********************************************************************
    ***********************************************************************
    L.GeoJSON.Havnelods_DK(options)
    GeoJSON-layer with danish harbors
    ***********************************************************************
    **********************************************************************/
    L.GeoJSON.Havnelods_DK = L.GeoJSON.Havnelods.extend({
        options: {
            fileName: 'havnelods_DK.json'
        },
        locationConstructor: nsHL.Location_DK
    });

    /*********************************************************************
    **********************************************************************
    L.GeoJSON.Havnelods_GL(options)
    GeoJSON-layer with Greenlandic towns, hamlets, and stations
    **********************************************************************
    **********************************************************************/
    L.GeoJSON.Havnelods_GL = L.GeoJSON.Havnelods.extend({
        options: {
            fileName: 'havnelods_GL.json'
        },
        locationConstructor: nsHL.Location_GL
    });

    /*********************************************************************
    **********************************************************************
    L.GeoJSON.Havnelods_Bridges(options)
    GeoJSON-layer with danish bridges
    **********************************************************************
    **********************************************************************/
    L.GeoJSON.Havnelods_Bridges = L.GeoJSON.Havnelods.extend({
        options: {
            idName    : 'BRO_ID',
            fileName  : 'havnelods_BR.json',
            planHeader: {da:'Broplan'/*, en:'MANGLER'*/}
        },
        locationConstructor: nsHL.Location_Bridges
    });

}(jQuery, L, this.i18next, this.moment, this, document));