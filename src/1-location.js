/****************************************************************************
location.js,

****************************************************************************/
(function ($, L, i18next, moment, window/*, document, undefined*/) {
	"use strict";

	window.fcoo = window.fcoo || {};
    var ns = window.fcoo = window.fcoo || {},
        nsHL = ns.Havnelods = ns.Havnelods || {},

        //Common options for marker
        bsMarkerOptions = {
            size     : 'small',

            markerClassName : 'overflow-hidden',

            transparent             : true,
            hover                   : true,
            shadowWhenPopupOpen     : true,
            tooltipHideWhenPopupOpen: true
        };

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
    ***********************************************************************************************/
    nsHL.Location = function(options = {}, parent){
        var _this = this;
        this.options = options;
        this.parent = parent;
        this.colorName = this.setup.colorName || 'blue';

        //Add content 'MAP' to all Locations
        this.options.MAP = true;

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
        getMarkerOptions: function(options = {}){
            return  $.extend(true,
                        options.noTooltip ? {} : {tooltip: this.header},
                        options.markerPane ? {pane      : options.markerPane} : {},
                        options.shadowPane ? {shadowPane: options.shadowPane} : {},
                        bsMarkerOptions,
                        this.markerOptions()
                    );
        },

        /***********************************
        asTableRow
        ***********************************/
        asTableRow: function(){
            return {
                id         : this.id,
                name       : this.name,
                location   : this.locationText(),
                chart      : this.options.KORT_NR || '',
                annotation : this.annotation ? {icon:'far fa-circle-exclamation', className: 'alert-info annotation'} : '',
                centerOnMap: {type:'button', icon:'fa-map-location-dot', fullWidth: true, fullHeight: true, square: true, noBorder: true, onClick: this.centerOnMap.bind(this) }
            };
        },


        /***********************************
        asSmallTableRow
        ***********************************/
        asSmallTableRow: function(){
            return {
                id          : this.id,
                name        : '<span class="fw-bold">'+ this.name + '</span><br>' + this.locationText(),
                annotation  : this.annotation ? {text:' ', className: 'alert-info annotation'} : ''
            };
        },


        /*****************************************
        buttonShow
        *****************************************/
        buttonShow: function(){
            return {
                id     : 'window_show'+this.id,
                icon   : 'fa-window-maximize',
                text   : {da: 'Vis', en:'Show'},
                class  : 'min-width-5em',
                onClick: this.asModal.bind(this)
            };
        },

        /*****************************************
        buttonGST
        *****************************************/
        buttonGST: function(small){
            if (this.setup.externalUrl)
                return {
                    id     :'dhl_show'+this.id,
                    icon   : 'far fa-link',
                    text   : ['abbr:gst', small ? {da: 'ver.', en:'ver.'} : {da: ' version', en:' Version'}],
                    class  : small ? 'min-width-5em' : 'min-width-8em',
                    onClick: this.showGST.bind(this)
                };
            else
                return null;
        },

        /*****************************************
        centerOnMap
        *****************************************/
        centerOnMap: function(){
            if (this.bsModal)
                this.bsModal.close();

            if (this.parent.bsModal)
                this.parent.bsModal.close();

            var map = this.parent.getMap();

            if (!map) return;

            //Call onCenterOnMap from generel options or from this' messages or from this onCenterOnMap = function(message, map)
            [   this.options        ? this.options.onCenterOnMap        : null,
                this.parent.options ? this.parent.options.onCenterOnMap : null,
                nsHL.options        ? nsHL.options.onCenterOnMap        : null
            ].forEach( eventFunc => {
                if (eventFunc)
                    eventFunc.apply(this, [this, map]);
            }, this);


            map.setView(this.latLng, map.getZoom(), {animate: false, reset: true});

            var marker = this.getMarker(map);
            if (marker)
                marker.openPopup();
        },

        /*****************************************
        showGST
        *****************************************/
        showGST: function(){
            window.open( this.setup.externalUrl.replace('<ID>', this.id) );
        },

        /*****************************************
        asModal
        *****************************************/
        asModal: function(id, latlng, element, map){
            var locationGroup = this.parent,
                historyList = locationGroup.historyList = locationGroup.historyList ||
                    new window.HistoryList({
                        action: function( id ){
                            var location = locationGroup.getLocation(id);
                            location.asModal();
                        }
                    });

            historyList.callAction = false;
            historyList.add( this.id );
            historyList._callOnUpdate();

            var options = {
                    header    : this.header,

                    flexWidth : true,
                    extraWidth: true,

                    historyList: historyList,

                    fixedContent: this.fixedContent.bind(this),
                    content     : this.accordionOptions({modalWidth:800, map:'small', multiOpen: true}),
                    extended: {
                        flexWidth   : true,
                        megaWidth   : true,
                        fixedContent: this.fixedContent.bind(this),
                        content     : this.accordionOptions({modalWidth:1200, map:'large', allOpen: true})
                    },
                    isExtended: nsHL.options.modalIsExtended,

                    footer    : gst_footer,
                    buttons   : [this.buttonGST(false), locationGroup.buttonShowAll(false)],

                    static    : false,
                    show      : true
                };

            //Create or update bsModal
            locationGroup.bsModalLocation =
                locationGroup.bsModalLocation ?
                locationGroup.bsModalLocation.update(options) :
                $.bsModal( options );


            //Find last button = "Show all"
            if (!locationGroup.showMessagesButton){
                var buttons = locationGroup.bsModalLocation.bsModal.$buttons;
                locationGroup.showMessagesButton = buttons[buttons.length-1];
            }

            //Hide the "Show all"-button if messages-list is already visible
            locationGroup.showMessagesButton.toggle(
                !(locationGroup.bsModal && locationGroup.bsModal.hasClass('show'))
            );

            locationGroup.getMap( map );
            locationGroup.bsModalLocation.show();

        },

        /*****************************************
        createMarker
        *****************************************/
        createMarker: function(options = {}){
            var extendedWidth = 320;

            var marker = L.bsMarkerCircle( this.latLng, this.getMarkerOptions(options) );

            if (!options.noPopup)
                marker.bindPopup({
                    fixable     : true,
                    onNew       : this.asModal.bind(this),
                    header      : this.header,

                    maxHeight   : 260,
                    width       : 260,
                    clickable   : true,

                    fixedContent: this.fixedContent.bind(this),
                    content     : null,
                    extended    : {
                        maxHeight   : 375,
                        width       : extendedWidth,
                        clickable   : false,
                        scroll      : true,
                        fixedContent: this.fixedContent.bind(this),
                        content     : this.extendedContent.bind(this, {modalWidth: extendedWidth, map: false}),
                        footer      : true
                    },

                    onOpen        : function(popup){ this.currentMap = popup._map; },
                    onOpenContext : this.parent,
                    onClose       : function(){ this.currentMap = null; },
                    onCloseContext: this.parent,

                    buttons:[
                        this.buttonShow(true),
                        this.buttonGST(true),
                        this.parent.buttonShowAll(true)
                    ],
                    footer: gst_footer
                });


            return marker;

        },

        /*****************************************
        getMarker
        *****************************************/
        getMarker: function(map){
            var result;
            map.eachLayer( (item) => {
                if (item.feature && (item.feature.properties === this)){
                    result = item;
                    return true;
                }
            }, this);
            return result;
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
                            id      : section.list[0].id,
                            header  : section.header,
                            content : sectionContent,
                            class   : section.class || ''
                        });
                }
            });

            return result;
        },

        /*****************************************
        locationText
        Harbor DK : HOVEDFARVAND_DDL2 - FARVANDSAFSNIT_B - Position - KORT_NR
        Harbor GL : LANDSDEL - HOVEDFARVAND_DDL2 - FARVANDSAFSNIT_B  - Position - KORT_NR
        Bridges DK: BELIGGENHED<br>Position - KORT_NR
        content : [
            {id: {DK: 'HOVEDFARVAND_DDL2', GL: 'LANDSDEL',          BR: 'BELIGGENHED'}                  },
            {id: {DK: 'FARVANDSAFSNIT_B',  GL: 'HOVEDFARVAND_DDL2', BR: null         }, before: ' - '   },
            {id: {DK: null,                GL: 'FARVANDSAFSNIT_B',  BR: null         }, before: ' - '   },
        *****************************************/
        locationText: function(){
            var _this = this,
                idList,
                result = '';
            switch (this.type){
                case 'DK':  idList = ['HOVEDFARVAND_DDL2', 'FARVANDSAFSNIT_B'  , 'KYSTAFSNIT'       ]; break;
                case 'GL':  idList = ['LANDSDEL',           'HOVEDFARVAND_DDL2', 'FARVANDSAFSNIT_B' ]; break;
                case 'BR':  idList = ['BELIGGENHED'                                                 ]; break;
            }
            idList.forEach((id) => {
                if (_this.options[id])
                    result = result + (result ? ', ' : '') + _this.options[id];
            });
            return result;
        },

       /*****************************************
        fixedContent

        Create the content for the fixed part of popups and modal.
        Contains of tree parts:
        1. Name

        2. Location ("Beliggenhed")
        Harbor DK : HOVEDFARVAND_DDL2 - FARVANDSAFSNIT_B - Position - KORT_NR
        Harbor GL : LANDSDEL - HOVEDFARVAND_DDL2 - FARVANDSAFSNIT_B  - Position - KORT_NR
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

        3. Annotation ("Bemærkning...")
        *****************************************/
        fixedContent: function($body){
            var _this = this,
                fixedContentTextClass     = 'd-block text-center',
                fixedContentBoldTextClass = fixedContentTextClass + ' fw-bold',
                hasOnClickPosition        = !!this.parent.options.onClickPosition,
                link                      =  hasOnClickPosition ? onClickPosition    : null,
                textData                  =  hasOnClickPosition ? {hl_location: _this} : null,

                content = [];

            //1. Name
            content.push({
                text     : this.name,
                textClass: fixedContentBoldTextClass
            });


            //2. Location ("Beliggenhed") = 2.A=Text, 2.B=Position, 2.C=Map
            var locationContent = [];

            //2.A=Text
            locationContent.push({text: {da: this.locationText()}});

            //2.B=Position
            var posText = '';
            if (this.options.BREDDE && this.options.LAENGDE){
                posText = this.options.BREDDE + ' ' + this.options.LAENGDE;
                locationContent.push({text: posText, link: link, textData: textData, textClass: fixedContentTextClass});
            }


            //2.C=Map
            var mapText = '';
            ['KORT_NR', 'HAVNEPLANSKORT_NR'].forEach((id) => {
                if (_this.options[id])
                    mapText = mapText + (mapText ? ' - ' : '') + _this.options[id];
            });
            if (mapText)
                locationContent.push({text: {da:mapText}});

            //Create <div> with flex-display holding the elements in locationContent
            content.push(
                $('<div/>')
                    .addClass('location-group d-flex justify-content-center')
                    ._bsAddHtml(locationContent)
            );

            //3. Annotation ("Bemærkning...")
            if (this.annotation)
                content.push({
                    text     : {da: 'Anmærkning...'},
                    textClass: fixedContentTextClass + ' ' + this.parent.options.annotationClass
                });


            $body._bsAddHtml(content);
            return $body;
        },


        /*****************************************
        extendedContent
        *****************************************/
        extendedContent: function(options, $body){
            $.bsAccordion( this.accordionOptions(options) ).appendTo($body);
        },


        /*****************************************
        createMap
        *****************************************/
        createMap: function($element, accOptions){
            var largeMap = accOptions.map == 'large',
                $inner   = $('<div/>').appendTo($element),
                $map     = $('<div/>')
                               .css({
                                   height: largeMap ? '500px' : '300px',
                                   width:'100%'
                               })
                              .appendTo($inner),
                map = L.map($map.get(0), nsHL.options.leaflet.mapOptions);

            L.tileLayer(
                nsHL.options.leaflet.tileUrl,
                {attribution: nsHL.options.leaflet.attribution || ''}
            ).addTo(map);

            map.setView(this.latLng, map.getZoom(), {animate: false, reset: true});

            //Create marker by creaating geoJOSN-layer with only one marker
            this.parent.getGeoJSON({onEachFeature: null, noTooltip: true, noPopup: true}, this.id).addTo(map);

            //Add button on map to center on geoJSON-elements
            map.addControl(
                L.control.bsButton({
                    position: 'topcenter',
                    icon    : 'fa-expand',
                    onClick : this._maps_center.bind(this),
                    context : this
                })
            );

            //Save the map in the Location and sync the maps in different modal-modes
            this.maps = this.maps || {};
            this.maps[map._leaflet_id] = map;
            map.on('moveend zoomend', this._maps_update_center_and_zoom.bind(this) );

            //Resize the map and set view to geoJSON-objects when the outer element is resized
            $element.resize( function(){
                map.invalidateSize();
            });
        },

        /*****************************************
        _maps_center
        *****************************************/
        _maps_center: function(){
            var latlng = this.latLng;
            this.mapCenter = latlng;

            $.each( this.maps, (id, map) => {
                map.setView(latlng, nsHL.options.leaflet.mapOptions.zoom, {animate: false, reset: true});
            });

        },

        /*****************************************
        _maps_update_center_and_zoom
        *****************************************/
        _maps_update_center_and_zoom: function(event){
            if (this.doNotUpdate) return;
            this.doNotUpdate = true;
            var _this = this,
                mapId = event.target._leaflet_id,
                map   = this.maps[mapId];

            this.mapCenter = map.getCenter();
            this.mapZoom   = map.getZoom();
            $.each( this.maps, (id, map) => {
                if (map._leaflet_id != mapId)
                    map.setView(_this.mapCenter, _this.mapZoom, {animate: false, reset: true});
            }, this);
            this.doNotUpdate = false;
        },



        /*****************************************
        accordionOptions
        *****************************************/
        accordionOptions: function(accOptions = {}){
            var _this         = this,
                accordionList = [],
                modalWidth    = accOptions.modalWidth || 400,
                inclMap       = !!accOptions.map;

            //Accordion list with all text
            var first = true;
            this.contentList().forEach((section) => {
                var sectionContent = section.content;
                if (section.id == 'MAP')
                    //Bug fix to pass accOptions to the map-creator
                    sectionContent = function(sectionContent){
                        return function($elem){
                            sectionContent.apply(this, [$elem, accOptions]);
                        };
                    }(sectionContent);

                if ((section.id != 'MAP') || inclMap){
                    accordionList.push({
                        text          : section.header,
                        content       : sectionContent,
                        contentContext: this,
                        isOpen        : first,
                        className     : section.class
                    });
                    first = false;
                }
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
                            innerHeight    : Math.min(430, (modalWidth - 35)*1/1.5),   //The height of the inner-container with the items. Fits landscape-mode within given modal-width
                            fitHeight      : true,  //If true and innerHeight is set: All images get max-height = innerHeight
                            itemsMaxOwnSize: false, //If true, or innerHeight and fitHeight is set: Image size can be bigger that its original size
                            defaultOnClick : true   //If true and no itemOnClick or item.onClick: Click on image open a modal-window
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
                neverClose: accOptions.allOpen,
                multiOpen : accOptions.multiOpen,
            };
        }
    };

    //Extend Havnelods.Location to include contextmenu
    $.extend(nsHL.Location.prototype, L.BsContextmenu.contextmenuInclude);


}(jQuery, L, this.i18next, this.moment, this, document));



