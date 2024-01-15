/****************************************************************************
5-location-content.js,
Setup to create content for different classes of Locations
****************************************************************************/
(function ($, L, i18next, moment, window, document, undefined) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {};


    nsHL.HAVNEKATEGORI2text = function( havnekategori ){
        switch (''+havnekategori){
            case '1': return {da: 'By'     , en: 'Town'   };
            case '2': return {da: 'Bygd'   , en: 'Hamlet' };
            case '3': return {da: 'Station', en: 'Station'};
        }
        return {da:'', en:''};
    };

    nsHL.HAVNEKATEGORI2text_plural = function( havnekategori ){
        switch (''+havnekategori){
            case '1': return {da: 'Byer'     , en: 'Towns'   };
            case '2': return {da: 'Bygder'   , en: 'Hamlets' };
            case '3': return {da: 'Stationer', en: 'Stations'};
        }
        return {da:'', en:''};
    };
    /***********************************************************************************************
    contentList is a list of sections. each section contains a header and a list of ids and options
    for the data given the section

    CONTENTLIST: []SECTION
    SECTION = {
        header : {da:STRING, en:STRING},
        content: STRING or []STRING or []ELEMENT
        class  : class-name for the content
    }
    ELEMENT: {
        id    : STRING,
        around: [STRING, STRING]
        before: STRING  - only if there is an element before
        after : STRING  - only if there is an element after
        format: function( content ) return formatted string or $-element
        falseAsZero: BOOLEAN. If true value == false is treated as value == 0
    }

    ***********************************************************************************************/
    function Section(options){
        this.header = $._bsAdjustText(options.header);
        //this.header.en = this.header.en || this.header.da;
        this.before = options.before;
        this.after = options.after;
        this.class = options.class || '';

        this.notType  = options.notType;
        this.onlyType = options.onlyType;

        var content = options.content;
        if (typeof content == 'string')
            content = [content];
        if ($.isArray(content))
            content.forEach( (element, index) => {
                if (typeof element == 'string')
                    content[index] = {id: element};
            });

        var list = this.list = [];
        content.forEach( (element) => {
            list.push(element);
        });
    }

    Section.prototype = {
        content: function(hlType, hlOptions){
            var result = '',
                after = '',
                list  = [];

            //Create local copy of this.list with type-versions
            this.list.forEach( (element) => {
                var newElement = $.extend(true, {}, element);

                $.each( newElement, (id, options) => {
                    if ($.isPlainObject(options))
                        newElement[id] = options[hlType];
                });
                list.push(newElement);
            });

            list.forEach( (element) => {
                var id = element.id || null,
                    value = id ? hlOptions[element.id] : undefined;

                if ((value === undefined) || ((value === false) && !element.falseAsZero))
                    return;

                //Special version with create-function
                if (element.create){
                    result = element.create;
                    return true;
                }

                value = element.format ?
                        element.format(value, this) :
                            ((value === false) && element.falseAsZero) ? 0 :
                            value;

                if (after)
                    result = result + after;

                if (result && element.before)
                    result = result + element.before;

                if (element.around)
                    result = result + (element.around[0] || '');

                result = result + value;

                if (element.around)
                    result = result + (element.around[1] || '');

                after = element.after || '';

            });

            if (result && this.before)
                result = this.before + result;

            if (result && this.after)
                result = result + this.after;

            if (typeof result == 'string')
                result = result.replaceAll('\n', '<br>');

            return result;
        }
    };

    nsHL.contentList = [{
        //SECTION for the map
        header : {da: 'Kort', en:'Map'},
        content: [{
            id    : 'MAP',
            create: function($elem, options){
                this.createMap($elem, options);
            }
        }]
    },{
        /*
        Befolkning - only for Harbor-GL
        */
        header  : {da:'Befolkning'},
        onlyType: 'GL',
        content: [
            {id: 'HAVNEKATEGORI',          after : '<br>', format: function (havnekategori){ return nsHL.HAVNEKATEGORI2text(havnekategori).da;} },
            {id: 'INDBYGGERANTAL',         after : ' indbyggere', falseAsZero: true},
            {id: 'INDBYGGERANTAL_AARSTAL', around: [' (',')']}
        ]
    }];

    //Add SECTION for Annotation (Anmærkning)
    nsHL.contentList.push({
        header : {da: 'Anmærkning'},
        content: 'ANMERKNING',
        class  : 'hl-annotation-colors alert-info',
    });


    //Add simple SECTION for no-bridge
    var list = [
        'Havnen'                  , 'HAVNEN',
        'Stedbeskrivelse'         , 'STEDBESKRIVELSE',
        'Dybder'                  , 'DYBDER',
        'Største skibe'           , 'STORSTE',
        'Vandstand'               , 'VANDSTAND',
        'Strøm'                   , 'STROM',
        'Is'                      , 'IS',
        'Vind'                    , 'VIND',
        'Tåge'                    , 'TAAGE',
        'Besejling'               , 'BESEJLING',
        'Dagens længde'           , 'DAGENS_LAENGDE',
        'Vejbro'                  , 'VEJBRO',
        'Fartbegrænsning'         , 'FARTBEGR',
        'Afmærkning'              , 'AFMAERK',
        'Erhverv'                 , 'ERHVERV',
        'Forsyning'               , 'FORSYNING',
        'Redningsstation'         , 'REDNINGSSTATION',
        'Båker'                   , 'BAAKER',
        'Fyr'                     , 'FYR',
        'Tågesignal'              , 'TAAGESIGNAL',
        'Kabler'                  , 'KABLER',
        'Ledninger'               , 'LEDNINGER',
        'Ankerplads'              , 'ANKERPL',
        'Ankringsforbud'          , 'ANKRINGSFORBUD',
        'Lods'                    , 'LODS',
        'Lodspligt'               , 'LODSTVANG',
//      'Havnelods'               'HAVNELODSEN'         Bruges nok ikke
        'Bugsering'               , 'BUGSERING',
        'Ressourcer'              , 'RESSOURCER',
        'Havnekontor'             , 'HAVNEKONTOR',
        'Toldklarering'           , 'TOLDKLARERING',
        'Havneområde'             , 'HAVNEOMRAADE',
        'Kommunikation'           , 'KOMMUNIKATION',
        'Særlige bestemmelser'    , 'SAERLIGE'
    ];

    for (var i=0; i<list.length; i=i+2)
        nsHL.contentList.push({
            header : {da: list[i]},
            content: list[i+1],
            notType: 'BR'
        });

    //Add simple SECTION for only-bridge
    //The following elements are included in SAERLIGE: BEMAERKNINGER, EJER, DRIFT_OG_VEDLIGHOLD, BRO_AABNINGER
    var contentList = [{
            content: 'BROTYPE',                 header: {da: 'Brotype'}
        },{
            content: 'LANGDE',                  header: {da: 'Brolængde'}, after: ' m',
        },{
            content: 'GENSEJL_HOJDE',           header: {da: 'Gennemsejlingshøjde'/*, en: 'Vertical clearance'*/}
        },{
            content: 'GENSEJL_BREDDE',          header: {da: 'Gennemsejlingsbredde'/*, en: 'Horizontal clearance'*/}
        },{
            content: 'AFMARKNING',              header: {da: 'Afmærkning'}
        },{
            content: 'STROM',                   header: {da: 'Strøm'}
        },{
            content: 'BESEJLING',               header: {da: 'Besejling'}
        },{
            content: 'SEJLADS_GENNEM_BROER',    header: {da: 'Sejlads gennem broen'}
        },{
            content: 'BROVAGTENS_BEFOEJELSER',  header: {da: 'Brovagtens beføjelser'}
        },{
            content: 'AABNINGSTIDER',           header: {da: 'Åbningstider'}
        },{
            content: 'KABLER',                  header: {da: 'Kabler'}
        },{
            content: 'KOMMUNIKATION',           header: {da: 'Kommunikation'}
        },{
            content: 'SIGNALER_FRA_BRO',        header: {da: 'Signaler fra bro'}
        },{
            content: 'GENERELLE_BESTEMMELSER',  header: {da: 'Generelle bestemmelser' }
        },{
            content: 'SAERLIGE',                header: {da: 'Særlige bestemmelser' }
        }
    ];

    contentList.forEach( (options) => {
        options.onlyType = 'BR';
        nsHL.contentList.push(options);
    });








    //Adjust nsHL.contentList
    nsHL.contentList.forEach( (options, index) => {
        nsHL.contentList[index] = new Section(options);
    });

}(jQuery, L, this.i18next, this.moment, this, document));



