/****************************************************************************
location-Bridge.js,

****************************************************************************/
(function ($, L, i18next, moment, window/*, document, undefined*/) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {},


    /**********************************************************************
    Location_Bridges
    Location with danish bridges
    **********************************************************************/
    /*
    Some of the bridges inside Copenhagen has positions a bit out of place.
    A manual updated list is provided from Google Maps
    */
    bridgePosition = {
        22: [55.67484537832718,  12.587356127444165],  //Knippelsbro
        23: [55.670240277061,    12.578930829293164],  //Langebro
        //24: [],                                        //Sjællandsbroen

        33: [55.61431447919968,  12.50837744135166 ],  //Kalvebodbroen og Sorterendebroen
        34: [55.647753740430446, 12.550257096758363],  //Teglværksbroen
        35: [55.66148686647116,  12.566828460520881],  //Bryggebroen
        36: [55.672406177849055, 12.579935406011998],  //Bryghusbroen
        37: [55.67967959865513,  12.591338013089933],  //Nyhavnsbroen
        39: [55.67767664980004,  12.598961086715246],  //Trangravsbroen

        40: [55.679445137435444, 12.600760740581082],  //Proviantbroen
        41: [55.672449865427794, 12.58378214728075 ],  //Cirkelbroen
        42: [55.6785548995787,   12.594725869775333],  //Inderhavnsbroen

        94: [55.67105496389518,  12.579812531385574],  //Lille Langebro

        134: [55.65326955043776,  12.555979626486682]   //Alfred Nobels Bro
    };

    nsHL.Location_Bridges = function(/*options, parent*/){
        nsHL.Location.apply(this, arguments);
        this.type = 'BR';
    };

    nsHL.Location_Bridges.prototype = $.extend(true, {}, nsHL.Location.prototype, {
        setup: {
            id2OptionsId: {id: 'BRO_ID', name: 'NAVN'},
            planPrefix  : 'BRO',

            optionsFunc: function(options){
                if (bridgePosition[options.BRO_ID])
                    options.latLng = L.latLng( bridgePosition[options.BRO_ID] );
            },
            externalUrl : 'https://www.danskehavnelods.dk/#BID=<ID>',
            planHeader  : {da:'Broplan', /*en:'MANGLER'*/}


        },

        /***********************************
        getIcon
        ***********************************/
        getIcon: function(){
            return 'fai fai-bridge6';
        },

        /***********************************
        markerOptions
        ***********************************/
        markerOptions: function(){
            return {
                iconClass : this.getIcon(),
                scaleInner   : 180,
                colorName    : 'white',
                iconColorName: 'black',

                round     : false,
                thinBorder: true,
                noBorder  : false
            };
        }
    });

}(jQuery, L, this.i18next, this.moment, this, document));



