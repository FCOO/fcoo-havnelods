/****************************************************************************
location-GL.js,

****************************************************************************/
(function ($, L, i18next, moment, window/*, document, undefined*/) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {};

    /**********************************************************************
    Location_GL
    Location with Greenlandic towns, hamlets, and stations

    https://www.gronlandskehavnelods.dk/foto/G100AASA.jpg

    https://www.gronlandskehavnelods.dk/planer/jpg_200/G100AAS1.jpg

    **********************************************************************/
    nsHL.Location_GL = function(/*options, parent*/){
        nsHL.Location_DK.apply(this, arguments);
        this.type = 'GL';
    };

    nsHL.Location_GL.prototype = $.extend(true, {}, nsHL.Location_DK.prototype, {
        setup: {
            colorName   : 'harbor-gl',
            externalUrl : 'https://www.gronlandskehavnelods.dk/#HID=<ID>'

        },

        /***********************************
        getType
        1 (Town)   : Full circle
        2 (Hamlet) : Inner dot
        3 (Station): Small inner dot
        ***********************************/
        getType: function(){
            return this.options.HAVNEKATEGORI;
        },

        /***********************************
        getIcon
        ***********************************/
        getIcon: function(){
            var type = this.getType();
            if (type == '1')
                return L.bsMarkerAsIcon( this.getMarkerOptions() );
            else
                return [['far fa-square-full', 'fas fa-square-full fa-lbm-color-' + this.colorName + ' ' + (type == '2' ? 'fa-normal-square' : 'fa-small-square')]];
        },

        /***********************************
        markerOptions
        ***********************************/
        markerOptions: function(){
            var options = {},
                type    = this.getType();

            if (type == '1')
                options = {
                    colorName      : this.colorName,
                    borderColorName: 'black'
                };
            else
                options = {
                    innerIconClass : 'fas fa-square-full',
                    scaleInner     : type == '2' ? 130 : null,

                    colorName      : 'white',
                    borderColorName: 'black',
                    iconColorName  : this.colorName,
                };

            options = $.extend(true, {}, options, {
                round       : false,
                thinBorder  : true,
                noBorder    : false
            });

            return options;
        },

        /***********************************
        filter
        ***********************************/
        filter: function( filterValue ){
            filterValue = filterValue ? filterValue.split('_')[1] : '0'; //filterValue = 'cat_N' => 'N'
            return ''+this.options.HAVNEKATEGORI == filterValue;
        }
    });


}(jQuery, L, this.i18next, this.moment, this, document));



