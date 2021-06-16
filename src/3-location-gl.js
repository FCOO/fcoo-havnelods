/****************************************************************************
location-GL.js,

****************************************************************************/
window.niels = 0;

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
this.INDEX = 1;
        nsHL.Location_DK.apply(this, arguments);
    };

    nsHL.Location_GL.prototype = $.extend(true, {}, nsHL.Location_DK.prototype, {
        setup: {
            pdfUrl      : 'https://www.gronlandskehavnelods.dk/PDF/Report/<ID>?type=0&onlyText=0',
            photoUrlMask: 'https://www.gronlandskehavnelods.dk/foto/<FILENAME>',
            planUrlMask : 'https://www.gronlandskehavnelods.dk/planer/jpg_200/<FILENAME>'
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
                return [['far fa-square-full', 'fas fa-square-full fa-lbm-color-' + nsHL.locationColorName + ' ' + (type == '2' ? 'fa-normal-square' : 'fa-small-square')]];
        },

        /***********************************
        markerOptions
        ***********************************/
        markerOptions: function(){
            var options = {},
                type    = this.getType();

            if (type == '1')
                options = {
                    colorName      : nsHL.locationColorName,
                    borderColorName: 'black'
                };
            else
                options = {
                    innerIconClass : 'fas fa-square-full',
                    scaleInner     : type == '2' ? 130 : null,

                    colorName      : 'white',
                    borderColorName: 'black',
                    iconColorName  : nsHL.locationColorName,
                };

            options = $.extend(true, {}, options, {
                round       : false,
                thinBorder  : true,
                noBorder    : false
            });

            return options;
        }
    });


}(jQuery, L, this.i18next, this.moment, this, document));



