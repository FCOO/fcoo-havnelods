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
        nsHL = ns.Havnelods = ns.Havnelods || {},

        bsMarkerOptions = {
            size     : 'small',

            markerClassName : 'overflow-hidden',

            transparent             : true,
            hover                   : true,
            shadowWhenPopupOpen     : true,
            tooltipHideWhenPopupOpen: true
        };

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
    Erhvervshavne / Commertial Ports
    Broer / Bridges
*/


    /**********************************************************************
    L.GeoJSON.Havnelods(options)
    Generel constructor for all variations
    ***********************************************************************/
    L.GeoJSON.Havnelods = L.GeoJSON.extend({
    //Default options
        options: {
            subDir      : 'havnelods',
            fileName    : 'havnelods.json',
            dataIndex   : 0,        //Index for in

            id2OptionsId: {},       //{id:ID} where id is this and ID is in options. Eq. {"id": "BRO_ID"}
            planPrefix  : '',       //STRING - Prefix for options-ids with info on plans for the location. (Harbor in DK has 'PLAN1', bridges in DK has 'BROPLAN1'
            pdfUrl      : '<ID>'    //STRING

        },

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
            ns.promiseList.append({
                fileName: ns.dataFilePath({mainDir: true, subDir: this.options.subDir, fileName: this.options.fileName}),
                resolve : $.proxy(this.resolve, this)
            });
        },

        /*********************************************
        getMarkerOptions
        *********************************************/
        getMarkerOptions: function(location){
            return $.extend(true, {}, bsMarkerOptions, this._markerOptions(location) );
        },

        /*********************************************
        getIcon - Is set for each group (DK, GL, Bridge)
        *********************************************/
        getIcon: function(location){
            var result = L.bsMarkerAsIcon(location.markerOptions);
            return result;
        },

        /*********************************************
        _markerOptions - Is set for each group (DK, GL, Bridge)
        *********************************************/
        _markerOptions: function(/*location*/){
            return {};
        },

        /*****************************************
        photoPlanUrl
        *****************************************/
        photoPlanUrl: function(fileName){
            return ns.dataFilePath(true, this.options.subDir, "photos_and_plans/") + fileName;
        },

        /*********************************************
        resolve
        *********************************************/
        resolve: function(data){
            /*
            data = {id0: []LOCATION, id1:[]LOCATION, id2:[]LOCATION}
            Using options.dataIndex to get correct data-set
            */
            var _this       = this,
                geoJSONData = {
                    type    : "FeatureCollection",
                    features: []
                },
                dataIndex = this.options.dataIndex,
                index = 0,
                dataSet = [];

            $.each(data, function(id, subData){
                if (index == dataIndex)
                    dataSet = subData;
                index++;
            });
            this.list = [];

            var optionsFunc = this.options.optionsFunc || function(){};

            $.each(dataSet, function(index, options){
                optionsFunc(options);

                var location = new nsHL.Location(options, _this);

               location.index = _this.list.length;
                _this.list.push(location);

                geoJSONData.features.push({
                    type      : "Feature",
                    geometry  : {type: "Point", coordinates: [location.latLng.lng, location.latLng.lat]},
                    properties: location
                });
            });

            this.addData(geoJSONData);

//console.log(niels);
        },

        /*********************************************
        pointToLayer
        *********************************************/
        pointToLayer: function(geoJSONPoint){
            return geoJSONPoint.properties.createMarker();
        }
    });



    /**********************************************************************
    ***********************************************************************
    L.GeoJSON.Havnelods_DK(options)
    GeoJSON-layer with danish harbors
    ***********************************************************************
    **********************************************************************/
    L.GeoJSON.Havnelods_DK = L.GeoJSON.Havnelods.extend({
        /***********************************
        initialize
        ***********************************/
        initialize: function(geojson, options = {}) {
            options = $.extend({
                //Options for DK Harbors
                dataIndex   : 1,

                id2OptionsId: {
                    id      : 'HAVNE_ID',
                    name    : 'NAVN'
                },
                planIndex: '',




                pdfUrl: 'https://www.danskehavnelods.dk/pdf/havnelodsenpdf.dll?WEB=1&TYP=0&ID=<ID>&NR=2'

            }, options);
            L.GeoJSON.Havnelods.prototype.initialize.call(this, geojson, options);
        },


        /***********************************
        getType
        ***********************************/
        getType: function(location){
            var isCommertial = location.options.ERHVERVSHAVN,
                isMarina = location.options.LYSTBAADEHAVN;
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
        getIcon: function(location){
            var type = this.getType(location),
                iconList = ['fal fa-square-full'];

            if (type.isCommertial)
                iconList.push('fas fa-square-full fa-lbm-color-navigation');

            if (type.isMarina || type.isNeither)
                iconList.push(
                    (type.isCommertial ? 'far fa-square-full fa-lbm-color-white' : 'fas fa-square-full fa-lbm-color-navigation') +
                    ' ' +
                    (type.isNeither ? 'fa-small-square' : 'fa-normal-square')
                );
            iconList.push('fal fa-square-full');

            return [iconList];
        },

        /***********************************
        _markerOptions
        ***********************************/
        _markerOptions: function(location){
            var type = this.getType(location);
            var options = {
                    colorName:  type.isCommertial ? 'navigation' : 'white',
                };

            if (type.isMarina || type.isNeither){
                options.scaleInner     = type.isNeither ? null : 130;
                options.innerIconClass = type.isBoth ? 'far fa-square-full' : 'fas fa-square-full';
                options.iconColorName  = type.isBoth ? 'white' : 'navigation';
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


    /*********************************************************************
    **********************************************************************
    L.GeoJSON.Havnelods_GL(options)
    GeoJSON-layer with Greenlandic towns, hamlets, and stations
    **********************************************************************
    **********************************************************************/
    L.GeoJSON.Havnelods_GL = L.GeoJSON.Havnelods.extend({
        /***********************************
        initialize
        ***********************************/
        initialize: function(geojson, options = {}) {
            options = $.extend({
                //Options for GL Harbors
                dataIndex   : 2,

                id2OptionsId: {
                    id      : 'HAVNE_ID',
                    name    : 'NAVN'
                },
                planIndex: '',




                pdfUrl: 'https://www.gronlandskehavnelods.dk/PDF/Report/<ID>?type=0&onlyText=0'


            }, options);
            L.GeoJSON.Havnelods.prototype.initialize.call(this, geojson, options);
        },

        /***********************************
        getIcon
        HAVNEKATEGORI = 1 (Town)   : Full circle
        HAVNEKATEGORI = 2 (Hamlet) : Inner dot
        HAVNEKATEGORI = 3 (Station): Small inner dot
        ***********************************/
        getIcon: function(location){
            var category = location.options.HAVNEKATEGORI;
            if (category == '1')
                return L.bsMarkerAsIcon(location.markerOptions);
            else
                return [['far fa-square-full', 'fas fa-square-full fa-lbm-color-navigation ' + (category == '2' ? 'fa-normal-square' : 'fa-small-square')]];
        },

        /***********************************
        _markerOptions
        HAVNEKATEGORI = 1 (Town)   : Full circle
        HAVNEKATEGORI = 2 (Hamlet) : Inner dot
        HAVNEKATEGORI = 3 (Station): Small inner dot
        ***********************************/
        _markerOptions: function(location){
            var options = {},
                category = ''+location.options.HAVNEKATEGORI;

            if (category == '1')
                options = {
                    colorName      : 'navigation',
                    borderColorName: 'black'
                };
            else
                options = {
                    innerIconClass : 'fas fa-square-full',
                    scaleInner     : category == '2' ? 130 : null,

                    colorName      : 'white',
                    borderColorName: 'black',
                    iconColorName  : 'navigation',
                };



            options = $.extend(true, {}, options, {
                round       : false,
                thinBorder  : true,
                noBorder    : false
            });

            return options;
        }


    });

    /*********************************************************************
    **********************************************************************
    L.GeoJSON.Havnelods_Bridges(options)
    GeoJSON-layer with danish bridges
    **********************************************************************
    **********************************************************************/

    /*
    Some of the bridges inside Copenhagen has positions a bit out of place.
    A manual updated list is provided from Google Maps
    */
    var bridgePosition = {
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

    function checkBridgePosition(options){
        if (bridgePosition[options.BRO_ID])
            options.latLng = L.latLng( bridgePosition[options.BRO_ID] );
    }

    L.GeoJSON.Havnelods_Bridges = L.GeoJSON.Havnelods.extend({
        /***********************************
        initialize
        ***********************************/
        initialize: function(geojson, options = {}) {
            options = $.extend({
                //Options for DK Bridges
                dataIndex   : 0,
                id2OptionsId: {
                    id      : 'BRO_ID',
                    name    : 'NAME'
                },
                planIndex  : 'BRO',
                optionsFunc: checkBridgePosition,
                pdfUrl   : 'https://www.danskehavnelods.dk/pdf/havnelodsenpdf.dll?WEB=1&TYP=1&ID=<ID>&NR=2'

            }, options);

            L.GeoJSON.Havnelods.prototype.initialize.call(this, geojson, options);
        },

        /***********************************
        getIcon
        ***********************************/
        getIcon: function(/*location*/){
            return 'fai fa-bridge6';
        },

        /***********************************
        _markerOptions
        ***********************************/
        _markerOptions: function(location){
            return {
                iconClass : this.getIcon(location),
                scaleInner   : 180,
                colorName    : 'white',
                iconColorName: 'black', //or 'navigation'

                round     : false,
                thinBorder: true,
                noBorder  : false
            };
        }
    });

/* Remaining options for bridges
Beliggenhed
HOVEDFARVAND_DDL2 - BELIGGENHED
LATLNG - KORT_NR

Anmærkning (i "blå" fremhævning)
ANMAERKNING_FRA_DATO - ANMAERKNING_TIL_DATO
ANMERKNING

Brotype
REFNAME

Brolængde
LANGDE

Gennemsejlingshøjde
GENSEJL_HOJDE

Gennemsejlingsbredde
GENSEJL_BREDDE

Afmærkning
AFMARKNING

Strøm
STROM


Besejling
BESEJLING

Sejlads gennem broen
SEJLADS_GENNEM_BROER

Brovagtens beføjelser
BROVAGTENS_BEFOEJELSER

Åbningstider
AABNINGSTIDER

Kabler
KABLER

Kommunikation
KOMMUNIKATION

Signaler fra bro
SIGNALER_FRA_BRO

Brotabel
BROLYSTABEL BROLYSTABEL_OPDATERET

Generelle bestemmelser
GENERELLE_BESTEMMELSER

Særlige bestemmelser
FRA - TIL
SAERLIGE_BESTEM

Bemærkninger
BEMAERKNINGER


Ejer, drift og vedligeholdelse, etc
EJER               : Eks = "Broen ejes af Odense Kommune",
DRIFT_OG_VEDLIGHOLD: Eks = "Odense Kommune\r\nBy-og Kulturforvaltningen\r\n\r\nDrift og anlæg\r\nOdense Slot, Nørregade 36\r\n5100 Odense C",
BRO_AABNINGER      : Eks = "LINDØ port of ODENSE\r\nKystvejen 100\r\n5330 Munkebo\r\nTlf.: 7228 2010\r\nE-mail: info@lpo.dk / havnekontor@lpo.dk\r\nHjemmeside: www.lpo.dk",

Publikationer
Link til officielle version hos GST

Kilde og opdatering
    (c) Geodatastyrelsen 12345 danskehavnelods.dk
    Sidste opdatering
    Tekst: TEKST_OPDATERET
    Plan 1: Findes
    Plan 2: Findes

*/


/* HAVENLODS FOR DK AND GL
Befolkning (KUN GL)
HAVNEKATEGORI
INDBYGGERANTAL indbygger(e)/Inhabitant(s) (INDBYGGERANTAL_AARSTAL)

Remaining options
    LANDSDEL
    HOVEDFARVAND_DDL2
    FARVANDSAFSNIT_A
    FARVANDSAFSNIT_B
    FARVANDSAFSNIT_C
    KYSTAFSNIT
    ERHVERVSHAVN
    LYSTBAADEHAVN
            HAVNEKATEGORI - KUN GL: 1:By/Town, 2:Bygd/Hamlet 3:Station/Station
    HAVNELODSEN
    KORT_NR
    HAVNEPLANSKORT_NR
    NATIONALITET
            INDBYGGERANTAL - KUN GL
            INDBYGGERANTAL_AARSTAL - KUN GL
    FORBUD_MOD_SEJLADS_MM
    REGLER_FOR_SEJLADS
    SEJLADS_MED_13_M_DYBGANG
    ANVENDELSE_AF_LODS
    ANDRE_BEKENDTGOERELSER
    GODKENDELSESDATO
    IKRAFTTRAEDELSESDATO
    REGLEMENT_KUNDGJORT_I_EFS_NR
    REGLEMENT_I_ARKIV
    BEMAERKNING
    TEKST_OPDATERET
    HAVNEN
    DYBDER
    STORSTE
    VANDSTAND
    STROM
    ISS
    VIND
    TAAGE
    VEJBRO
    TUNNEL
    FARTBEGR
    AFMAERK
    BAAKER
    FYR
    TAAGESIGNAL
    KABLER
    LEDNINGER
    ANKERPL
    ANKRINGSFORBUD
    LODS
    LODSTVANG
    BUGSERING
    REDNINGSSTATION
    RESSOURCER
    HAVNEKONTOR
    TOLDKLARERING
    HAVNEOMRAADE
    SAERLIGE
    ADVARSEL
    SVLIGGEPLADSER
    SVSAERLIGEFORHOLD
    FRA
    TIL
    BESEJLING_CLOB
    DAGENS_LAENGDE
    PIKTOGRAMMER_OPD_DATO
    ANMERKNING
    ANMAERKNING_FRA_DATO
    ANMAERKNING_TIL_DATO
    OFFENTLIG
    UN_CODE
    STEDBESKRIVELSE
    KOMMUNIKATION
    ERHVERV
    FORSYNING
*/

}(jQuery, L, this.i18next, this.moment, this, document));