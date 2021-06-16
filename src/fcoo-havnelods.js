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

    /*
    Names for menus:
        Havne og Broer (Danske Havnelods)
        Harbors and Bridges (only in Danish)
    OR
        Danish Harbors and Bridges (only in Danish)
    OR
        Danish Marinas, Ports, and Bridges (only in Danish)
    OR
        Denmark
            Harbors
                (o) Alle / All
                ( ) Kun Erhvervshavne / Only Commertial Ports
                ( ) Kun Lystbådehavne / Only Marinas
            Bridges

    Sub-layers:
    Lystbådehavne / Marinas
    Erhvervshavne / Commertial Ports
    Broer / Bridges

    Greenland:
        By/Town,
        Bygd/Hamlet
        Station/Station

*/


    /**********************************************************************
    L.GeoJSON.Havnelods(options)
    Generel constructor for all variations
    ***********************************************************************/
    L.GeoJSON.Havnelods = L.GeoJSON.extend({
        dataIndex          : 0,
        locationConstructor: null,

        //Default options
        options: {
            subDir      : 'havnelods',
            fileName    : 'havnelods.json',
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
        resolve
        *********************************************/
        resolve: function(data){
            /*
            data = {id0: []LOCATION, id1:[]LOCATION, id2:[]LOCATION}
            Using options.dataIndex to get correct data-set
            */
            var _this = this,
                geoJSONData = {
                    type    : "FeatureCollection",
                    features: []
                },
                dataIndex = this.dataIndex,
                index = 0,
                dataSet = [];

            $.each(data, function(id, subData){
                if (index == dataIndex)
                    dataSet = subData;
                index++;
            });
            this.list = [];

            $.each(dataSet, function(index, options){
                var location = new _this.locationConstructor(options, _this);
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
        },
    });

    /**********************************************************************
    ***********************************************************************
    L.GeoJSON.Havnelods_DK(options)
    GeoJSON-layer with danish harbors
    ***********************************************************************
    **********************************************************************/
    L.GeoJSON.Havnelods_DK = L.GeoJSON.Havnelods.extend({
        dataIndex: 1,
        locationConstructor: nsHL.Location_DK,

    });

    /*********************************************************************
    **********************************************************************
    L.GeoJSON.Havnelods_GL(options)
    GeoJSON-layer with Greenlandic towns, hamlets, and stations
    **********************************************************************
    **********************************************************************/
    L.GeoJSON.Havnelods_GL = L.GeoJSON.Havnelods.extend({
        dataIndex: 2,
        locationConstructor: nsHL.Location_GL
    });

    /*********************************************************************
    **********************************************************************
    L.GeoJSON.Havnelods_Bridges(options)
    GeoJSON-layer with danish bridges
    **********************************************************************
    **********************************************************************/
    L.GeoJSON.Havnelods_Bridges = L.GeoJSON.Havnelods.extend({
        dataIndex: 0,
        locationConstructor: nsHL.Location_Bridges,

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

Gennemsejlingshøjde - Vertical clearance
GENSEJL_HOJDE

Gennemsejlingsbredde - Horizontal clearance
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