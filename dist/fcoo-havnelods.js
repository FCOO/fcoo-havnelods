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
                        this.parent.options.markerPane ? {pane      : this.parent.options.markerPane} : {},
                        this.parent.options.shadowPane ? {shadowPane: this.parent.options.shadowPane} : {},
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
            var geoJSON = this.parent.getGeoJSON({
                    onlyLocationId: this.id,
                    geoJSON: {
                        onEachFeature: null,
                        markerOptions: {
                            noTooltip: true,
                            noPopup  : true
                        }
                    }
                });
            geoJSON.addTo(map);


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
        },

        /***********************************
        filter
        options.ERHVERVSHAVN : BOOLEAN
        options.LYSTBAADEHAVN: BOOLEAN
        ***********************************/
        filter: function(filterValue){
            return this.options[filterValue];
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
        },

        /***********************************
        filter
        ***********************************/
        filter: function( filterValue ){
            filterValue = filterValue ? filterValue.split('_')[1] : '0'; //filterValue = 'cat_N' => 'N'
            return ''+this.options.HAVNEKATEGORI == filterValue;
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


    //Extend Havnelods.options
    nsHL.options = $.extend( true, {


        smallTableWithAllLocations: false,

        //modalIsExtended: If true the modal 'start' as extended (modal-option.isExtended: true)
        modalIsExtended: ns.modernizrDevice.isDesktop || ns.modernizrDevice.isTablet,


        filterIcon     : 'fa-filter'

        //getDefaultMap: function(){ ... }

    }, nsHL.options || {} );



    //Extend window.fcoo.Havnelods.options with leaflet = options for different leaflet objects
    nsHL.options.leaflet = nsHL.options.leaflet || {};

    //window.Niord.options.leaflet.tileUrl = url for the tile-layer of the map inside the bsModal-window
    nsHL.options.leaflet.tileUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    //window.Niord.options.leaflet.attribute = attribute for the tile-layer of the map inside the bsModal-window
    nsHL.options.leaflet.attribution = '<i class="far fa-copyright"></i></i>&nbsp;<a target="_blank" href="https://www.openstreetmap.org/copyright/en">OpenStreetMap</a>';

    //window.Niord.options.leaflet.mapOptions = options for map-objects in modal-windows
    nsHL.options.leaflet.mapOptions = {
        zoomControl         : false,
        bsZoomControl       : false,
        bsZoomOptions: {
            position      : 'topleft',
            historyEnabled: false,
        },
        attributionControl  : false,    //Use bsAttributionControl instead of default attribution-control
        bsAttributionControl: true,

        closePopupOnClick   : true,	    //true	Set it to false if you don't want popups to close when user clicks the map.
        boxZoom             : false,    //true	Whether the map can be zoomed to a rectangular area specified by dragging the mouse while pressing the shift key.
        doubleClickZoom     : true,	    //true	Whether the map can be zoomed in by double clicking on it and zoomed out by double clicking while holding shift. If passed 'center', double-click zoom will zoom to the center of the view regardless of where the mouse was.
        dragging            : true,     //true	Whether the map be draggable with mouse/touch or not.
        zoomSnap            : .25,	    //1	Forces the map's zoom level to always be a multiple of this, particularly right after a fitBounds() or a pinch-zoom. By default, the zoom level snaps to the nearest integer; lower values (e.g. 0.5 or 0.1) allow for greater granularity. A value of 0 means the zoom level will not be snapped after fitBounds or a pinch-zoom.
        zoomDelta           : .25,	    //1	Controls how much the map's zoom level will change after a zoomIn(), zoomOut(), pressing + or - on the keyboard, or using the zoom controls. Values smaller than 1 (e.g. 0.5) allow for greater granularity.
        trackResize         : false,	//true	Whether the map automatically handles browser window resize to update itself.


        center  : [0,0],    //undefined	Initial geographic center of the map
        zoom    : 6,        //undefined	Initial map zoom level
        minZoom : 4,        //Minimum zoom level of the map. If not specified and at least one GridLayer or TileLayer is in the map, the lowest of their minZoom options will be used instead.
        maxZoom	: 18        //Maximum zoom level of the map. If not specified and at least one GridLayer or TileLayer is in the map, the highest of their maxZoom options will be used instead.
    };


    /**********************************************************************
    LocationGroup
    Generel constructor for group of Locations
    ***********************************************************************/
    function LocationGroup(options){
        this.options = $.extend(true, {}, this.options, options);

        //Add context-menu item
        this.addContextmenuItems([ this.buttonShowAll() ]);

        //Load and add geoJSON-data
        this.list = [];
        window.Promise.getJSON(
            ns.dataFilePath({mainDir: true, subDir: this.options.subDir, fileName: this.options.fileName}),
            {},
            this.resolve.bind(this)
        );
    }



    /***********************************************************************************************
    LocationGroup.prototype
    ***********************************************************************************************/
    LocationGroup.prototype = {
        options: {
            //Default options
            idName          : 'HAVNE_ID',
            subDir          : 'havnelods',
            fileName        : 'havnelods.json',
            images          : 'images',

            annotationId    : 'ANMERKNING',
            annotationClass : 'hl-annotation-colors hl-annotation alert-info'
        },
        locationConstructor: null,

        /*********************************************
        resolve
        *********************************************/
        resolve: function(data){
            //data = []LOCATION
            this.list = [];
            data.forEach((options) => {
/* TEST Only Hundested
if (options.NAVN != 'Hundested Havn') return false;
console.log(options);
//*/
                var location = new this.locationConstructor(options, this);
                location.index = this.list.length;
                this.list.push(location);
            }, this);
        },

        /*********************************************
        getGeoJSON
        *********************************************/
        getGeoJSON: function(options = {}){
            var geoJSONData = {
                    type    : "FeatureCollection",
                    features: []
                };
            this.list.forEach((location) => {
                if (location.latLng && (!options.onlyLocationId ||  (location.id == options.onlyLocationId)))
                    geoJSONData.features.push({
                        type      : "Feature",
                        geometry  : {type: "Point", coordinates: [location.latLng.lng, location.latLng.lat]},
                        properties: location
                    });
            });

            var geoJSON = new L.GeoJSON.Havnelods(null, options.geoJSON);
            geoJSON.addData(geoJSONData);
            return geoJSON;
        },


        /*********************************************
        buttonShowAll
        *********************************************/
        buttonShowAll: function(){
            return {
                icon   : 'fa-th-list',
                text   : {da:'Vis alle', en:'Show all'},
                class  : 'min-width-5em',
                onClick: this.asModal.bind(this)
            };
        },


        /*********************************************
        asModal
        Will display a list of all harbors as
        1: One column with all info, or
        2: Four columns with id, date, area, and title
        *********************************************/
        asModal: function(id, latlng, element, map){

            map = this.getMap( map );

            if (this.bsModal)
                this.bsModal.close();

            //Close any location-modal
            if (this.bsModalLocation)
                this.bsModalLocation.close();


            var hasFilter = !!this.locationConstructor.prototype.filter;

            //Check screen size and select between small and normal size table
            var displayInSmallTable = nsHL.options.smallTableWithAllLocations,
                columns = [];

            if (displayInSmallTable)
                columns.push(
                    { id: 'name',     noWrap: false,  header: {da:'Navn og beliggenhed', en:'Name and location'},    align: 'left', sortable: true }
                );
            else
                columns.push(
                    { id: 'name',     header: {da:'Navn',         en:'Name'},    noWrap: true,  align: 'left',  sortable: true },
                    { id: 'location', header: {da:'Beliggenhed', en:'Location'},                align: 'left',  sortable: true },
                    { id: 'chart',    header: {da:'Kort', en:'Chart'},                          align: 'center'                }
                );
            columns.push(
                {id: 'annotation', header: displayInSmallTable ? null : {da:'Anm.', en:'Ann.'},  align: 'center', noWrap: false, width: displayInSmallTable ? '1.2em' : '4em' }
            );
            if (!displayInSmallTable && map)
                columns.push(
                    {id: 'centerOnMap', header: {icon: 'fa-map'},  align: 'center', noWrap: false, width: '2em', noHorizontalPadding: true, noVerticalPadding: true }
                );

            this.bsTableOptions = {
                verticalBorder   : true,
                selectable       : true,
                allowZeroSelected: false,
                allowReselect    : true,
                onChange         : this.locationAsModal.bind(this),
                columns          : columns
            };

            //Create table and add data
            var bsTable = this.bsTable = $.bsTable(this.bsTableOptions);
            this.list.forEach( (location) => {
                bsTable.addRow( displayInSmallTable ? location.asSmallTableRow() : location.asTableRow() );
            });

            var bsModalOptions = {
                header     : {text: this.options.name},
                buttons    : hasFilter ? [
                    {icon: nsHL.options.resetFilterIcon, text:{da:'Nulstil', en:'Reset'}, class:'min-width-5em', onClick: this.resetFilter.bind(this)       },
                    {icon: nsHL.options.filterIcon,      text:{da:'Filter', en:'Filter'}, class:'min-width-5em', onClick: this.filterAsModalForm.bind(this) }
                ] : null,
                flexWidth  : true,
                megaWidth  : true,

                static       : true,
                show         : false,
                removeOnClose: true,

                footer       : hasFilter ? {text: '&nbsp;'} : null
            };

            //Create the modal and save the footer
            this.bsModal = this.bsTable.asModal( bsModalOptions );
            this.$bsModalFooter = this.bsModal.bsModal.$footer;

            //Filter and display the modal with the table
            this.filter(this.filterOptions);

            this.bsModal.show();
        },


        /*********************************************
        filterAsModalForm
        *********************************************/
        filterAsModalForm: function(){
            if (!this.filterBsModalForm){
                this.filterBsModalForm =  $.bsModalForm({
                    header: {
                        icon: nsHL.options.filterIcon,
                        text: {da:'Vis...', en:'Show...'},
                    },
                    closeWithoutWarning: true,
                    onSubmit: this.filter.bind(this),
                    scroll  : false,
                    content : [{
                        id       : 'filter',
                        type     : 'selectlist',
                        fullWidth: true,
                        items    : this.getFilterItems()
                    }]
                });
            }

            this.filterBsModalForm.edit( this.filterOptions || {filter: 'ALL'} );
        },

        /******************************************************
        filter
        ******************************************************/
        filter: function(filterOptions){
            this.filterOptions = filterOptions;
            var showAll = !filterOptions || (filterOptions.filter == 'ALL'),
                filterValue = showAll ? 'ALL' : filterOptions.filter;
            var _this = this;
            if (this.bsTable)
                this.bsTable.filterTable(function(rowData, id){
                    if (showAll)
                        return true;
                    var location = _this.getLocation(rowData.id || id);
                    return location ? location.filter(filterValue) : false;
                });
            this._updateFilterInfo();
        },

        /******************************************************
        resetFilter
        ******************************************************/
        resetFilter: function(){
            this.filterOptions = {filter: 'ALL'};
            this._updateFilterInfo();
            if (this.bsTable)
                this.bsTable.resetFilterTable();
        },


        _updateFilterInfo: function(){
            var filterExist = this.filterOptions && (this.filterOptions.filter) && (this.filterOptions.filter != 'ALL'),
                filterId = filterExist ? this.filterOptions.filter : 'ALL',
                filterText;

            if (filterExist)
                this.getFilterItems().forEach( (item) => {
                    if (item.id == filterId)
                        filterText = item.text;
                });

            this.$bsModalFooter
                .empty()
                ._bsAddHtml(filterExist ? {icon: nsHL.options.filterIcon, text: filterText} : '&nbsp;');
        },


        /*********************************************
        getLocation
        *********************************************/
        getLocation: function(id){
            return this.list.find(location => location.id == id);
        },

        /*********************************************
        locationAsModal
        *********************************************/
        locationAsModal: function(id){
            var loc = this.getLocation(id);
            if (loc)
                loc.asModal();
        },


        /*********************************************
        getMap
        *********************************************/
        getMap: function(map){
            this.currentMap = (map instanceof L.Map ? map : null) || this.currentMap || (nsHL.options.getDefaultMap ? nsHL.options.getDefaultMap() : null);
            return this.currentMap;
        },

    };

    //Extend LocationGroup to include contextmenu
    $.extend(LocationGroup.prototype, L.BsContextmenu.contextmenuInclude);




    /**********************************************************************
    ***********************************************************************
    nsHL.Havnelods_DK(options)
    LocationGroup with danish harbors
    ***********************************************************************
    **********************************************************************/
    nsHL.Havnelods_DK = function(options = {}){
        options.fileName = 'havnelods_DK.json';
        options.name = {da:'Havne i Danmark', en:'Harbors in Denmark'},

        LocationGroup.call(this, options);
        this.locationConstructor = nsHL.Location_DK;

        this.getFilterItems = function(){
            return [
                {id: 'ALL',           text: {da: 'Alle havne', en: 'All harbors'}},
                {id: 'ERHVERVSHAVN',  text: {da: 'Kun Erhvervshavne', en: 'Only Commercials Ports'}},
                {id: 'LYSTBAADEHAVN', text: {da: 'Kun Lystbådehavne', en: 'Only Marinas'}}
            ];
        };

    };
    nsHL.Havnelods_DK.prototype = Object.create(LocationGroup.prototype);


    /*********************************************************************
    **********************************************************************
    nsHL.Havnelods_GL(options)
    LocationGroup with Greenlandic towns, hamlets, and stations
    **********************************************************************
    **********************************************************************/
    nsHL.Havnelods_GL = function(options = {}){
        options.fileName = 'havnelods_GL.json';
        options.name = {da: 'Byer, Bygder og Stationer i Grønland', en: 'Towns, Hamlets, and Stations in Greenland'},

        LocationGroup.call(this, options);
        this.locationConstructor = nsHL.Location_GL;

        this.getFilterItems = function(){
            var result = [{id: 'ALL', text: {da: 'Alle Byer, Bygder og Stationer', en: 'All Towns, Hamlets, and Stations'}}];

            for (var i=0; i<10; i++){
                var text = nsHL.HAVNEKATEGORI2text_plural(i);
                if (text.da)
                    result.push({id:'cat_'+i, text: {da:'Kun '+text.da, en:'Only '+text.en}});
            }
            return result;
        };



    };
    nsHL.Havnelods_GL.prototype = Object.create(LocationGroup.prototype);

    /*********************************************************************
    **********************************************************************
    nsHL.Havnelods_Bridges(options)
    LocationGroup with danish bridges
    **********************************************************************
    **********************************************************************/
    nsHL.Havnelods_Bridges = function(options = {}){
        $.extend(options, {
            idName    : 'BRO_ID',
            fileName  : 'havnelods_BR.json',
            name      : {da:'Broer i Danmark', en:'Bridges in Denmark'},

            planHeader: {da:'Broplan'/*, en:'MANGLER'*/},

            noFilter  : true,
        });
        LocationGroup.call(this, options);
        this.locationConstructor = nsHL.Location_Bridges;
    };
    nsHL.Havnelods_Bridges.prototype = Object.create(LocationGroup.prototype);

    /**********************************************************************
    ***********************************************************************
    L.GeoJSON.Havnelods(options)
    Generel constructor for all variations
    ************************************************************************
    ***********************************************************************/
    L.GeoJSON.Havnelods = L.GeoJSON.extend({
        /*********************************************
        initialize
        *********************************************/
        initialize: function(geojson, options = {}) {
            options = $.extend(true, {}, {
                pointToLayer : $.proxy(this.pointToLayer, this),
                onEachFeature: $.proxy(this.onEachFeature, this),
            }, options);
            L.GeoJSON.prototype.initialize.call(this, geojson, options);
        },

        /*********************************************
        pointToLayer
        *********************************************/
        pointToLayer: function(geoJSONPoint){
            return geoJSONPoint.properties.createMarker(this.options.markerOptions);
        },

        /*********************************************
        onEachFeature - Add context-menu-items
        *********************************************/
        onEachFeature: function(feature, element){
            var loc = feature.properties;
            element
                .setContextmenuHeader(loc.header, true)
                .setContextmenuWidth( '8em' )
                .addContextmenuItems([
                    loc.buttonShow(),
                    loc.buttonGST(1),
                ])
                .setContextmenuParent(loc.parent);
        },
    });


}(jQuery, L, this.i18next, this.moment, this, document));