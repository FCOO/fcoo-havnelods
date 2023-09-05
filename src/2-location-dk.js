/****************************************************************************
location-DK.js,

****************************************************************************/
(function ($, L, i18next, moment, window/*, document, undefined*/) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {};

    /**********************************************************************
    Location_DK
    Location with danish harbors
    https://www.danskehavnelods.dk/foto/NKTANHOL1.jpg
    https://www.danskehavnelods.dk/planer/jpg_200/NKTANHOL.jpg
    **********************************************************************/
    nsHL.Location_DK = function(/*options, parent*/){
        this.type = 'DK';
        nsHL.Location.apply(this, arguments);
    };

    nsHL.Location_DK.prototype = $.extend(true, {}, nsHL.Location.prototype, {
        setup: {
            colorName   : 'harbor-dk',

            id2OptionsId: {id: 'HAVNE_ID', name: 'NAVN'},
            planIndex   : '',
            externalUrl : 'https://www.danskehavnelods.dk/#HID=<ID>'

        },

        /***********************************
        getType
        ***********************************/
        getType: function(){
            var isCommertial = this.options.ERHVERVSHAVN,
                isMarina = this.options.LYSTBAADEHAVN;
            return {
                isCommertial: isCommertial,
                isMarina    : isMarina,
                isBoth      : isCommertial && isMarina,
                isNeither   : !isCommertial && !isMarina
            };
        },

        /***********************************
        getIcon
        ***********************************/
        getIcon: function(){
            var type = this.getType(),
                iconList = ['fal fa-square-full'];

            if (type.isCommertial)
                iconList.push('fas fa-square-full fa-lbm-color-'+this.colorName);

            if (type.isMarina || type.isNeither)
                iconList.push(
                    (type.isCommertial ? 'far fa-square-full fa-lbm-color-white' : 'fas fa-square-full fa-lbm-color-'+this.colorName) +
                    ' ' +
                    (type.isNeither ? 'fa-small-square' : 'fa-normal-square')
                );
            iconList.push('fal fa-square-full');

            return [iconList];
        },

        /***********************************
        markerOptions
        ***********************************/
        markerOptions: function(){
            var type = this.getType();
            var options = {
                    colorName:  type.isCommertial ? this.colorName : 'white',
                };

            if (type.isMarina || type.isNeither){
                options.scaleInner     = type.isNeither ? null : 130;
                options.innerIconClass = type.isBoth ? 'far fa-square-full' : 'fas fa-square-full';
                options.iconColorName  = type.isBoth ? 'white' : this.colorName;
            }

            options = $.extend(true, {}, options, {
                borderColorName : 'black',
                round           : false,
                thinBorder      : true,
                noBorder        : false
            });

            return options;
        }
    });


}(jQuery, L, this.i18next, this.moment, this, document));