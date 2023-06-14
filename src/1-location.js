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



