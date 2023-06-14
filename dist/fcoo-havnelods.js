/****************************************************************************
location.js,

****************************************************************************/
(function ($, L, i18next, moment, window/*, document, undefined*/) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {},


        useMegaWidthModal = ns.modernizrDevice.isDesktop || ns.modernizrDevice.isTablet,

        //Common options for marker
        bsMarkerOptions = {
            size     : 'small',

            markerClassName : 'overflow-hidden',

            transparent             : true,
            hover                   : true,
            shadowWhenPopupOpen     : true,
            tooltipHideWhenPopupOpen: true
        };


    var modalWindow = null;

    var gst_footer = [
            {icon: 'fa-copyright', text: ['name:gst', '320-0088'], link: ['link:gst', 'link:gst']},
            {text: ['(','abbr:gst',')'], textClass:['me-0','me-0']}
        ];



    function onClickPosition(){
        var location = $(this).data('hl_location');
        if (location.parent.options && location.parent.options.onClickPosition)
            location.parent.options.onClickPosition(location);
        return false;
    }


    function getDateStr(date){
        if (!date)
            return '';

        //Date come is different formates: "YYYY-MM-DDTHH:MM:SS" "YYYY-MM-DD 00:00" "YYYY-MM-D" "MM-DD-YYYY"
        var dateStr = date.substring(0,10),
            format  = dateStr[2] == '-' ? 'DD-MM-YYYY' : 'YYYY-MM-DD';

        return moment(dateStr, format).dateFormat();
    }

    /***********************************************************************************************
    Location
    General object for all types of locations = Danish harbors, danish bridges, Greenlandic places

    parent = geoJSON-layer with options containing
    ***********************************************************************************************/
    nsHL.Location = function(options, parent){
        var _this = this;
        this.options = options;
        this.parent = parent;
        this.colorName = this.setup.colorName || 'blue';


        //Convert all "0" and "-1" to false and true and replace "\r\n" with "<br>"
        $.each(options, function(id, value){
            if ((value === "0") || (value === 0))
                value = false;
            else
            if ((value === "-1") || (value === -1))
                value = true;
            else
                if (typeof value == 'string')
                    value = value.replace("\r\n", "<br>");
            options[id] = value;
        });

        $.each(this.setup.id2OptionsId || {}, function(this_id, options_id){
            _this[this_id] = options[options_id];
        });

        this.setup.optionsFunc(options);


        //Create header and marker-options
        this.header = {
            icon: this.getIcon(),
            text: this.name
        };

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
        function getImageList(fileNamePrefix, textPrefix='UNKNOWN', infoPrefix='UNKNOWN', datePrefix='UNKNOWN', datePostfix='', photographerPrefix='UNKNOWN'){
            var result = [];
            for (var index = 0; index < 20; index++){
                var indexStr = index ? ''+index : '';
                if (options[fileNamePrefix + indexStr]){
                    result.push({
                        fileName    : options[fileNamePrefix + indexStr] + '.jpg',
                        text        : options[textPrefix + indexStr] || '',
                        info        : options[infoPrefix + indexStr] || '',
                        date        : options[datePrefix + indexStr + datePostfix] || options[datePrefix + datePostfix + indexStr] || '',
                        photographer: options[photographerPrefix + indexStr] || ''
                    });
                }
            }
            return result;
        }
        //********************************************
        if (options.latLng)
            this.latLng = options.latLng;
        else {
            var saveLatLngFormat = window.latLngFormat.options.formatId;
            window.latLngFormat.setFormat( window.latLngFormat.LATLNGFORMAT_DMM, true );

            this.latLng = L.latLng( window.latLngFormat(trimLatLng(options.BREDDE), trimLatLng(options.LAENGDE)).value() );

            if (!this.latLng)
                console.error('ERROR Invalid lat long:', 'id='+this.id, 'lat='+options.BREDDE, 'long='+options.LAENGDE);

            window.latLngFormat.setFormat( saveLatLngFormat, true );
        }

        //Get annotation
        this.annotation = parent.options.annotationId ? options[parent.options.annotationId] : null;


        //Create photoList = []{fileName, text, date, photographer}
        this.photoList = getImageList('FOTO', 'FOTOTEKST', 'UNKNOWN', 'OPR', '', 'FOTOGRAFNAVN');

        //Create planList = []{fileName, text, info, date}
        var planPrefix = this.setup.planPrefix || '';
        this.planList = getImageList(planPrefix+'PLAN', planPrefix+'PLANTEKST', planPrefix+'PLAN_INFO', planPrefix+'PLAN', '_OPDATERET');

        //Create brotabelList (only for bridges)
        this.brotabelList = getImageList('BROLYSTABEL');

    };

    /***********************************************************************************************
    Location.prototype
    ***********************************************************************************************/
    nsHL.Location.prototype = {
        setup: {
            id2OptionsId : {}, //{id:ID} where id is this and ID is in options. Eq. {"id": "BRO_ID"}
            planPrefix   : '', //STRING - Prefix for options-ids with info on plans for the location
            externalUrl  : '', //STRING


            optionsFunc : function(/*options*/){}, //Adjust options

            planHeader  : {da:'Havneplan'/*, en:'MANGLER'*/}

        },


        /*********************************************
        getIcon - Is set for each group (DK, GL, Bridge)
        *********************************************/
        getIcon: function(){
            return L.bsMarkerAsIcon( this.markerOptions() );
        },

        /*********************************************
        markerOptions - Is set for each group (DK, GL, Bridge)
        *********************************************/
        markerOptions: function(){ return {}; },


        /*********************************************
        getMarkerOptions
        *********************************************/
        getMarkerOptions: function(){
            return  $.extend(true,
                        {tooltip: this.header},
                        this.parent.options.markerPane ? {pane      : this.parent.options.markerPane} : {},
                        this.parent.options.shadowPane ? {shadowPane: this.parent.options.shadowPane} : {},
                        bsMarkerOptions,
                        this.markerOptions()
                    );
        },



        /*****************************************
        buttonGST
        *****************************************/
        buttonGST: function(){
            if (this.setup.externalUrl)
                return {
                    id     :'dhl_show'+this.id,
                    icon   : 'far fa-link',
                    text   : ['abbr:gst', {da: 'off. version', en:'Off. Version'}],
                    class : 'min-width-8em',
                    onClick: this.showGST.bind(this)
                };
            else
                return null;
        },

        /*****************************************
        showGST
        *****************************************/
        showGST: function(){
            window.open( this.setup.externalUrl.replace('<ID>', this.id) );
        },

        /*****************************************
        showInModalWindow
        *****************************************/
        showInModalWindow: function(){
            if (modalWindow)
                modalWindow.remove();

            modalWindow = $.bsModal({
                header      : this.header,
                flexWidth   : true,

                extraWidth  : !useMegaWidthModal,
                megaWidth   : useMegaWidthModal,


                content     : this.accordionOptions(true),
                footer      : gst_footer,
                buttons     : [this.buttonGST()],
                show        : true
            });
        },


        /*****************************************
        createMarker
        *****************************************/
        createMarker: function(){
            var this_showInModalWindow = this.showInModalWindow.bind(this);
            return L.bsMarkerCircle( this.latLng, this.getMarkerOptions() )

                        .bindPopup({
//HER                            flexWidth: true,
                            fixable : true,

                            //noVerticalPadding  :  true,
                            //noHorizontalPadding: true,

                            onNew  : this_showInModalWindow,
                            header : this.header,

                            maxHeight: 260,
                            width    : 260,
                            clickable: true,

                            fixedContent: this.fixedContent.bind(this, false),

                            content     : null,

                            extended: {
                                maxHeight   : 600,
                                width       : 511,  //Allows pictures to be 3/4 * 427
                                clickable   : false,
                                scroll      : true,
                                fixedContent: this.fixedContent.bind(this, true),

                                //content     : this.extendedContent(),
                                content     : this.extendedContent.bind(this, false ),

                                footer      : true
                            },

                            buttons:[
                                {
                                    id     :'window_show'+this.id,
                                    icon   : 'fal fa-window-maximize',
                                    text   : {da: 'Vis mere', en:'Show more'},
                                    class  : 'min-width-8em',
                                    onClick: this_showInModalWindow
                                },
                                this.buttonGST()
                            ],
                            footer: gst_footer
                        });

        },


        /*****************************************
        contentList
        *****************************************/
        contentList: function(){
            var result = [],
                type = this.type;

            nsHL.contentList.forEach( (section) => {
                if ( (!section.onlyType || section.onlyType.includes(type)) &&
                     (!section.notType  || (section.notType != type) ) )  {
                    var sectionContent = section.content(type, this.options);
                    if (sectionContent)
                        result.push({
                            header  : section.header,
                            content : sectionContent,
                        });
                }
            });
            return result;
        },



       /*****************************************
        fixedContent

        Beliggenhed
        Harbor DK : HOVEDFARVAND_DDL2 - FARVANDSAFSNIT_B<br>Position - KORT_NR
        Harbor GL : LANDSDEL - HOVEDFARVAND_DDL2 - FARVANDSAFSNIT_B<br>Position - KORT_NR
        Bridges DK: BELIGGENHED<br>Position - KORT_NR

        header  : {da:'Beliggenhed'},
        content : [
            {id: {DK: 'HOVEDFARVAND_DDL2', GL: 'LANDSDEL',          BR: 'BELIGGENHED'}                  },
            {id: {DK: 'FARVANDSAFSNIT_B',  GL: 'HOVEDFARVAND_DDL2', BR: null         }, before: ' - '   },
            {id: {DK: null,                GL: 'FARVANDSAFSNIT_B',  BR: null         }, before: ' - '   },

            {id: 'BREDDE',            before: '<br>', after: ' '  },
            {id: 'LAENGDE'                              },
            {id: 'KORT_NR',           before: ' - '               },
            {id: 'HAVNEPLANSKORT_NR', before: ' - '               }
        ]

        *****************************************/
        fixedContent: function(extended, $body){
            var _this = this,
                fixedContentTextClass     = 'd-block text-center',
                fixedContentBoldTextClass = fixedContentTextClass + ' fw-bold',
                hasOnClickPosition        = !!this.parent.options.onClickPosition,
                link                      =  hasOnClickPosition ? onClickPosition    : null,
                textData                  =  hasOnClickPosition ? {hl_location: _this} : null,

                content = [];


            //Name
            content.push({
                text     : this.name,
                textClass: fixedContentBoldTextClass
            });


            //"Beliggenhed"
            var idList, text = '';
            switch (this.type){
                case 'DK':  idList = ['HOVEDFARVAND_DDL2', 'FARVANDSAFSNIT_B'  , 'KYSTAFSNIT'       ]; break;
                case 'GL':  idList = ['LANDSDEL',           'HOVEDFARVAND_DDL2', 'FARVANDSAFSNIT_B' ]; break;
                case 'BR':  idList = ['BELIGGENHED'                                                 ]; break;
            }
            idList.forEach((id) => {
                if (_this.options[id])
                    text = text + (text ? ', ' : '') + _this.options[id];
            });
            content.push({
                text     : text,
                textClass: fixedContentTextClass
            });

            //Position
            var posText = '';
            if (this.options.BREDDE && this.options.LAENGDE)
                posText = this.options.BREDDE + ' ' + this.options.LAENGDE;

            //Kort
            var mapText = '';
            ['KORT_NR', 'HAVNEPLANSKORT_NR'].forEach((id) => {
                if (_this.options[id])
                    mapText = mapText + (mapText ? ' - ' : '') + _this.options[id];
            });


            if (extended){
                var textArray = [];
                if (posText) textArray.push({text: posText, link: link, textData: textData});
                if (posText && mapText) textArray.push(' - ');
                if (mapText) textArray.push(mapText);
                if (textArray.length)
                    content.push(
                        $('<div/>')
                            .addClass('d-flex justify-content-center')
                            ._bsAddHtml(textArray)
                    );
            } else {
                if (posText)
                    content.push({text: posText, link: link, textData: textData, textClass: fixedContentTextClass});
                if (mapText)
                    content.push({text: mapText, textClass: fixedContentTextClass});
            }

            if (this.annotation)
                content.push({
                    text     : extended ? '<strong>Anmærkning</strong><br>' + this.annotation : {da: 'Anmærkning...'/*, en:'Annotation...'*/},
                    textClass: (extended ? 'd-block' : fixedContentTextClass) + ' ' + this.parent.options.annotationClass
                });


            $body._bsAddHtml(content);
        },


        /*****************************************
        extendedContent
        *****************************************/
        extendedContent: function(allOpen, $body){
            $.bsAccordion( this.accordionOptions(allOpen) ).appendTo($body);
        },

        /*****************************************
        accordionOptions
        *****************************************/
        accordionOptions: function(allOpen){
            var _this         = this,
                accordionList = [];

            //Accordion list with all text
            var first = true;
            this.contentList().forEach((section) => {
                accordionList.push({
                    text   : section.header,
                    content: section.content,
                    open   : first
                });
                first = false;
            });


            //Add accordions with photos, plans and bridge light
            [
                {listId: 'photoList',    text: {da: 'Billeder'/*, en: 'Pictures'*/}, datePreText: [{da: 'Fotograferet'/*, en:'MANGLER'*/}] },
                {listId: 'planList',     text: _this.setup.planHeader,               datePreText: [_this.setup.planHeader, {da: 'opdat.'/*, en:'MANGLER'*/}] },
                {listId: 'brotabelList', text: {da: 'Brotabel'/*, en: 'MANGLER'*/},  datePreText: [{da: 'Brotabel opd.'/*, en:'MANGLER'*/}] }
            ].forEach((options) => {
                var list = _this[options.listId];
                if (list && list.length){
                    var carouselList = [];
                    list.forEach((imgOpt) => {
                        var url = ns.dataFilePath(true, _this.parent.options.subDir, _this.parent.options.images+"/") + imgOpt.fileName,
                            subText = [...options.datePreText];
                        if (imgOpt.date)
                            subText.push(getDateStr(imgOpt.date));
                        carouselList.push({
                            //icon:
                            url    : url,
                            text   : imgOpt.text,
                            subText: imgOpt.date ? subText : null
                        });
                    });
                    accordionList.push({
                        text    : options.text,
                        content : {
                            type           : 'carousel',
                            list           : carouselList,
                            innerHeight    : allOpen ? 427 : 320,   //The height of the inner-container with the items.
                            fitHeight      : true,                  //If true and innerHeight is set: All images get max-height = innerHeight
                            itemsMaxOwnSize: false,                 //If true, or innerHeight and fitHeight is set: Image size can be bigger that its original size
                            defaultOnClick : true                   //If true and no itemOnClick or item.onClick: Click on image open a modal-window
                        }
                    });
                }
            });

            //Add special header with source and last updated
            var textUpdated = this.options['TEKST_OPDATERET'],
                planUpdated = this.options['PLAN1_OPDATERET']    || this.options['PLAN_OPDATERET1'] ||
                              this.options['BROPLAN1_OPDATERET'] || this.options['BROPLAN_OPDATERET1'],
                content = [{
                    icon: 'fa-copyright', text: ['name:gst', '320-0088'], link: ['link:gst', 'link:gst']
                }];

            if (textUpdated || planUpdated){
                content.push({da:'<br>Sidste opdateringer:'/*, en: 'Same as da' */});
                if (textUpdated)
                    content.push({da:'<br>Tekst: ' + getDateStr(textUpdated)/*, en: 'Same as da' */});
                if (planUpdated)
                    content.push({da:'<br>' + (this.type == 'BR' ? 'Broplan' : 'Plan') + ': ' + getDateStr(planUpdated)/*, en: 'Same as da' */});
            }

            accordionList.push({
                text    : {da: 'Kilde'/*, en: 'Source'*/},
                content : content
            });

            return {
                type      : 'accordion',
                list      : accordionList,
                neverClose: allOpen
            };
        }
    };
}(jQuery, L, this.i18next, this.moment, this, document));




;
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
;
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
        }
    });


}(jQuery, L, this.i18next, this.moment, this, document));




;
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




;
/****************************************************************************
5-location-content.js,
Setup to create content for different classes of Locations
****************************************************************************/
(function ($, L, i18next, moment, window, document, undefined) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {};


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
        format: function( content ) return formatted string
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

                if ((value === undefined) || (value === false))
                    return;

                value = element.format ? element.format(value) : value;

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

            result = result.replaceAll('\n', '<br>');

            return result;
        }
    };

    function HAVNEKATEGORI2text( havnekategori ){
        switch (''+havnekategori){
            case '1': return 'By';      //Town,
            case '2': return 'Bygd';    //Hamlet
            case '3': return 'Station'; //Station
        }
        return '';
    }

    nsHL.contentList = [{
        /*
        Befolkning - only for Harbor-GL
        */
        header  : {da:'Befolkning'},
        onlyType: 'GL',
        content: [
            {id: 'HAVNEKATEGORI',          after : '<br>', format: HAVNEKATEGORI2text},
            {id: 'INDBYGGERANTAL',         after : ' indbyggere'},
            {id: 'INDBYGGERANTAL_AARSTAL', around: [' (',')']}
        ]
    }];

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
        'Ankerplads'              , 'ANKERPL',
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




;
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