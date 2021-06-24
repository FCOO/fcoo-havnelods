/****************************************************************************
	fcoo-danskehavnelods.js,

	(c) 2021, FCOO

	https://github.com/FCOO/fcoo-danskehavnelods
	https://github.com/FCOO

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {};

    var type_port   = 'erhverv',
        type_marina = 'lyst',
        type_bridge = 'bro',

        bsMarkerOptions = {
            size: 'small',

            markerClassName : 'overflow-hidden',

            transparent             : true,
            hover                   : true,
            shadowWhenPopupOpen     : true,
            tooltipHideWhenPopupOpen: true
        },

        bsMarkerOptionsType = {};

    bsMarkerOptionsType[type_port] = $.extend(true, {}, bsMarkerOptions, {
        iconClass: 'fai fai-ship3-black port_icon_adjust',
        scaleInner: 200,

        colorName      : 'white',
        borderColorName: 'navigation',
        iconColorName  : 'navigation',

        round       : false,
        thinBorder  : true,
        noBorder    : false

    });

    bsMarkerOptionsType[type_marina] = $.extend(true, {}, bsMarkerOptions, {
        iconClass : 'fai fai-sailboat4-black fa-flip-horizontal',
        scaleInner: 200,

        colorName      : 'white',
        borderColorName: 'navigation',
        iconColorName  : 'navigation',

        round       : true,
        thinBorder  : true,
        noBorder    : false

    });

    bsMarkerOptionsType[type_bridge] = $.extend(true, {}, bsMarkerOptions, {
        iconClass : 'fai fai-bridge6',
        scaleInner: 180,

        colorName      : 'white', //'yellow',
        //borderColorName: 'navigation',
        iconColorName  : 'black',

        round       : false,
        thinBorder  : false,
        noBorder    : true,
    });

    /*
    Names for menus:
        Havne og Broer (Danske Havnelods)
        Harbors and Bridges (only in Danish)
    OR
        Danish Harbors and Bridges (only in Danish)
    OR
        Danish Marinas, Ports, and Bridges (only in Danish)

    Sub-layers:
    Lystbådehavne / Marinas
    Erhvervshavne / Commercial Ports
    Broer / Bridges
*/


    /***********************************************************************************************
    L.GeoJSON.DanskeHavnelods(options) Create a geoJSONLayer
    options
    ***********************************************************************************************/
    L.GeoJSON.DanskeHavnelods = L.GeoJSON.extend({
    //Default options
        options: {
            subDir      : 'danskehavnelods',
            fileName    : 'danskehavnelods.json',
            type        : 'ALL',
        },

        //initialize
        initialize: function(options) {
            options = $.extend(true, options || {}, {pointToLayer: $.proxy(this.pointToLayer, this) });

            L.GeoJSON.prototype.initialize.call(this, null, options);

            //Load and add geoJSON-data
            ns.promiseList.append({
                fileName: ns.dataFilePath({subDir: this.options.subDir, fileName: this.options.fileName}),
                resolve : $.proxy(this.resolve, this)
            });
        },

        /*********************************************
        resolve
        *********************************************/
        resolve: function(data){
            var _this       = this,
                geoJSONData = {
                    type    : "FeatureCollection",
                    features: []
                };

            this.list = [];
            $.each(data, function(index, options){
                if ((_this.options.type == 'ALL') || (_this.options.type == options.type)){
                    var location = new Location(options);
                    location.index = _this.list.length;
                    _this.list.push(location);

                    geoJSONData.features.push({
                        type      : "Feature",
                        geometry  : {type: "Point", coordinates: [location.latLng.lng, location.latLng.lat]},
                        properties: location
                    });
                }
            });

            this.addData(geoJSONData);
        },

        /*********************************************
        pointToLayer
        *********************************************/
        pointToLayer: function(geoJSONPoint){
            return geoJSONPoint.properties.createMarker();
        }
    });



    /***********************************************************************************************
    Location
    ***********************************************************************************************/
    var TEST = 12;
    var Location = function(options){
        this.id         = options.id;
        this.type       = options.type;
        this.name       = options.name;
        this.MANGLER    = options.TODO;


        this.position   = options.position;

        //TEST
        if (this.position[0] == 123){
            this.position = [56, TEST];
            TEST = TEST + 0.5;
        }

        this.latLng     = L.latLng(this.position);

        this.header = {
            icon: L.bsMarkerAsIcon(bsMarkerOptionsType[this.type]),
            text: this.name
        };
    };


    var imgWidth = 300;
    Location.prototype = {
        createMarker: function(){
            var this_show = $.proxy(this.show, this);

            return L.bsMarkerCircle( this.latLng, $.extend(true, {tooltip: {text: this.name}}, bsMarkerOptionsType[this.type]))
                        .bindPopup({
                            width: imgWidth + 6,
                            //flexWidth: true,
                            fixable : true,

                            noVerticalPadding  :  true,
                            noHorizontalPadding: true,

                            onNew   : this_show,
                            header  : this.header,
                            content : $('<img src="https://www.danskehavnelods.dk/planer/jpg_70/LF_AGRNS.jpg"/>') //<== MANGLER
                                        .css('max-width', imgWidth+'px')
                                        .on('click', this_show),
                            buttons: [{
                                id      :'dhl_show'+this.id,
                                _icon    : 'fa-window-maximize',
                                icon    : $.bsNotyIcon.info,
                                text    : {da: 'Vis informationer', en:'Show Informations'},
                                onClick : this_show
                            }],
                            footer: {
                                icon: 'fa-copyright',
                                text: 'name:gst',
                                link: 'link:gst'
                            }
                        });
        },

        show: function(){
                $.bsModalFile(
                    'https://www.danskehavnelods.dk/pdf/havnelodsenpdf.dll?WEB=1&TYP=' + (this.type == 'bro' ? 1 : 0) + '&ID='+this.id + '&NR=2',
                    {header: this.header}
                );
        }
    };
}(jQuery, L, this, document));



