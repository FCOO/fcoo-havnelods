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
;
/****************************************************************************
location.js,

****************************************************************************/
window.niels = 0;

(function ($, L, i18next, moment, window/*, document, undefined*/) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {};

    /***********************************************************************************************
    Facilities
    Groups of facilities at harbors
    ***********************************************************************************************/
    nsHL.FacilitiesGroupList = [{
            text: {da:'Faciliteter', en:'Facilities'},
            list: [
                { id: 'MILJOESTATION', icon: 'far fa-trash-alt',    text: {da: 'Miljøstation', en:'Trash'} }, //Need better english word!
                { id: 'APOTEK',        icon: 'far fa-clinic-medical',text: {da: 'Apotek', en:'Pharmacy'} },
                { id: 'BAD',           icon: 'far fa-shower',       text: {da: 'Bad', en:'Bath'} },
                { id: 'BANK',          icon: 'far fa-university',   text: {da: 'Bank', en:'Bank'} },
                { id: 'EL',            icon: 'far fa-plug',         text: {da: 'Eltilslutning 220 volt', en:'Electricity 220 volt'} },
                { id: 'FRISOR',        icon: 'far fa-cut',          text: {da: 'Frisør', en:'Hairdresser'} },
                { id: 'HANDICAP',      icon: 'far fa-wheelchair',   text: {da: 'Handicapvenlige faciliteter', en:'Disabled Facilities'} },
                { id: 'TOILET',        icon: 'far fa-restroom',     text: {da: 'Toilet', en:'Restroom'} },
                { id: 'VAND',          icon: 'far fa-faucet-drip',  text: {da: 'Vand', en:'Water'} },
                { id: 'VASKEM',        icon: 'far fa-washer',       text: {da: 'Møntvaskeri', en:'Laundrette'} },
                { id: 'CAFE',          icon: 'far fa-coffee',       text: {da: 'Cafeteria/café/grillbar', en:'Cafeteria/Café/Grill Bar'} },
                { id: 'CAMPING',       icon: 'far fa-campground',   text: {da: 'Campingplads', en:'Campsite'} },
                { id: 'CYKEL',         icon: 'far fa-bicycle',      text: {da: 'Cykeludlejning', en:'Bicycle rental'} },
                { id: 'GRILL',         icon: 'fai fa-barbecue2',    text: {da: 'Grillplads', en:'Barbecue area'} },
                { id: 'LEGEPL',        icon: 'fai fa-child',        text: {da: 'Legeplads', en:'Playground'} }, // or fai-playground(2)
                { id: 'RESTAU',        icon: 'far fa-utensils',     text: {da: 'Restaurant', en:'Restaurant'} },
                { id: 'SURF',          icon: 'fai fa-wind-surfing', text: {da: 'Surfing', en:'Surfing'} }, //or fai fa-surfing-board(2)
                { id: 'INFO',          icon: 'far fa-info',         text: {da: 'Turistinformation', en:'Tourist Information'} }
            ]
        },{
            text: {da:'Service', en:'Service'},
            list: [
                { id: 'KRAN',          icon: 'fai fa-hook',     text: {da: 'Kran', en:'Crane'} },
                { id: 'SLIP',          icon: 'fai fa-slipway',  text: {da: 'Slip/bedding/travelift/slæbested', en:'Travelift/Slipway'} },
                { id: 'VARKSTED',      icon: 'far fa-wrench',   text: {da: 'Værksted/værf', en:'Workshop/Shipyard'} },
            ]
        },{
            text: {da:'Proviantering', en:'Provisioning'},
            list: [
                { id: 'BENZIN',        icon: 'far fa-gas-pump',         text: {da: 'Benzin/diesel/olie', en:'Petrol/Diesel/Oil'} },
                { id: 'GAS',           icon: 'fai fa-gas-cylinder',     text: {da: 'Flaskegas', en:'Bottled gas'} }, //or fai fa-gas-cylinder2-4
                { id: 'KIOSK',         icon: 'far fa-shopping-basket',  text: {da: 'Kiosk/købmand/proviant', en:'Kiosk/Grocery/Provisions'} }, //or fa-shopping-cart
                { id: 'PROVIANT',      icon: '', /*<-- TODO/MANGLER*/   text: {da: 'Skibsproviantering', en:'Provisions'} },
            ]
        },{
            text: {da:'Transport og Kommunikation', en:'Transport and Communication'},
            list: [
                { id: 'BUS',           icon: 'far fa-bus',      text: {da: 'Busforbindelse', en:'Bus Connection'} },
                { id: 'FARGE',         icon: 'fai fa-ferry2',   text: {da: 'Færgeforbindelse', en:'Ferry Connection'} }, //or fa-ferry
                { id: 'POST',          icon: 'far fa-envelope', text: {da: 'Posthus', en:'Postoffice'} },
                { id: 'TELE',          icon: 'far fa-phone',    text: {da: 'Telefon', en:'Telephone'} },
                { id: 'TOG',           icon: 'far fa-train',    text: {da: 'Togforbindelse', en:'Train Connection'} },
            ]
        }];




    /***********************************************************************************************
    Location
    General object for all types of locations = Danish harbors, danish bridges, Greenlandic places

    parent = geoJSON-layer with options containing
        id2OptionsId: {id:ID} where id is this and ID is in options. Eq. {"id": "BRO_ID"}
        planPrefix  : STRING - Prefix for options-ids with info on plans for the location
        pdfUrl      : STRING
    }
    ***********************************************************************************************/
    nsHL.Location = function(options, parent){
        var _this = this;
        this.options = options;
        this.parent = parent;
        var parentOptions = parent.options;

        //Convert all "0" and "-1" to false and true and replace "\r\n" with "<br>"
        $.each(options, function(id, value){
            if (value === "0")
                value = false;
            else
            if (value === "-1")
                value = true;
            else
                if (typeof value == 'string')
                    value = value.replace("\r\n", "<br>");
            options[id] = value;
        });

        $.each(parentOptions.id2OptionsId || {}, function(this_id, options_id){
            _this[this_id] = options[options_id];
        });

        //Create header and marker-options
        this.markerOptions = this.parent.getMarkerOptions(this);
        this.header = {
            icon: this.parent.getIcon(this),
            text: this.name
        };
        this.markerOptions.tooltip = this.header;

        //Find position = options.BREDDE and options.LAENGDE as degree, decimal minutes (55°38,5'N 012°33,1'E)
        //*******************************************
        function trimLatLng(text){
            text = text.toUpperCase();
            var result = '',
                s = '0123456789,.NSWE';
            for (var i=0; i<text.length; i++)
                result += (s.indexOf(text[i]) == -1 ? ' ' : text[i]);
            return result;
        }
        //********************************************
        if (options.latLng)
            this.latLng = options.latLng;
        else {
            var saveLatLngFormat = window.latLngFormat.options.formatId;
            window.latLngFormat.setFormat( window.latLngFormat.LATLNGFORMAT_DMM, true );

            this.latLng = L.latLng( window.latLngFormat(trimLatLng(options.BREDDE), trimLatLng(options.LAENGDE)).value() );

            window.latLngFormat.setFormat( saveLatLngFormat, true );
        }

        //Create photoList = []{fileName, text, date, photographer}
        this.photoList = [];
        for (var photoIndex = 1; photoIndex < 20; photoIndex++)
            if (options['FOTO'+photoIndex]){
                this.photoList.push({
                    fileName    : options['FOTO'+photoIndex].toLowerCase() + '.jpg',
                    text        : options['FOTOTEKST'+photoIndex] || '',
                    date        : options['OPR'+photoIndex] || '',
                    photographer: options['FOTOGRAFNAVN'+photoIndex] || ''
                });
window.niels++;
            }

        //Create planList = []{fileName, text, info, date}
        this.planList = [];
        var planPrefix = parentOptions.planPrefix || '';
        for (var planIndex = 0; planIndex < 20; planIndex++){
            var indexStr = planIndex ? ''+planIndex : '';
            if (options[planPrefix+'PLAN'+indexStr]){
                this.planList.push({
                    fileName    : options[planPrefix+'PLAN'+indexStr].toLowerCase() + '.jpg',
                    text        : options[planPrefix+'PLANTEKST'+indexStr] || '',
                    info        : options[planPrefix+'PLAN_INFO'+indexStr] || '',
                    date        : options[planPrefix+'PLAN'+indexStr+'_OPDATERET'] || ''
                });
window.niels++;
            }


        }
    };


    nsHL.Location.prototype = {
        /*****************************************
        photoUrl
        *****************************************/
        photoUrl: function(index){
            return index < this.photoList.length ? this.parent.photoPlanUrl( this.photoList[index].fileName ) : '';
        },

        /*****************************************
        planUrl
        *****************************************/
        planUrl: function(index){
            return index < this.planList.length ? this.parent.photoPlanUrl( this.planList[index].fileName ) : '';
        },

        /*****************************************
        showPdf
        *****************************************/
        showPdf: function(){
            $.bsModalFile(
                this.parent.options.pdfUrl.replace('<ID>', this.id),
                {header: this.header}
            );
        },

        /*****************************************
        content_minimized
        *****************************************/
        content_minimized: function($body){
            var url = this.photoUrl(0) || this.planUrl(0);
            if (url)
                $('<img src="' + url + '" style="max-width:320px"/>').appendTo($body);
            else
                $('<div/>')._bsAddHtml({text:{da:'MANGLER', en:'NOT READY'}}).appendTo($body);
        },

        /*****************************************
        createMarker
        *****************************************/
        createMarker: function(){
            var this_show = $.proxy(this.showPdf, this);

            return L.bsMarkerCircle( this.latLng, this.markerOptions)
                        .bindPopup({
                            width: 330,
                            //flexWidth: true,

                            fixable : true,

                            //noVerticalPadding  :  true,
                            //noHorizontalPadding: true,

                            onNew  : this_show,
                            header : this.header,
                            content: $.proxy(this.content_minimized, this),
                            buttons:[{
                                id     :'dhl_show'+this.id,
                                _icon  : 'fa-window-maximize',
                                icon   : $.bsNotyIcon.info,
                                text   : {da: 'Vis informationer', en:'Show Informations'},
                                onClick: this_show
                            }],
                            footer: {
                                icon: 'fa-copyright',
                                text: 'name:gst',
                                link: 'link:gst'
                            }
                        });
        }
    };














}(jQuery, L, this.i18next, this.moment, this, document));



