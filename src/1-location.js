/****************************************************************************
location.js,

****************************************************************************/
window.niels = 0;

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


    //Set color and shape for all Locations
    nsHL.locationColorName = 'blue';//'navigation';

window.plans = [0,0,0];
window.photos = [0,0,0];

    /***********************************************************************************************
    Location
    General object for all types of locations = Danish harbors, danish bridges, Greenlandic places

    parent = geoJSON-layer with options containing
    ***********************************************************************************************/
    nsHL.Location = function(options, parent){
        var _this = this;
        this.options = options;

        this.parent = parent;

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
window.photos[this.INDEX]++;
                this.photoList.push({
                    fileName    : options['FOTO'+photoIndex].toUpperCase() + '.jpg',
                    text        : options['FOTOTEKST'+photoIndex] || '',
                    date        : options['OPR'+photoIndex] || '',
                    photographer: options['FOTOGRAFNAVN'+photoIndex] || ''
                });
window.niels++;
            }

        //Create planList = []{fileName, text, info, date}
window.plans[this.INDEX] = window.plans[this.INDEX] || 0;
        this.planList = [];
        var planPrefix = this.setup.planPrefix || '';
        for (var planIndex = 0; planIndex < 20; planIndex++){
            var indexStr = planIndex ? ''+planIndex : '';
            if (options[planPrefix+'PLAN'+indexStr]){
window.plans[this.INDEX]++;
                this.planList.push({
                    fileName    : options[planPrefix+'PLAN'+indexStr].toUpperCase() + '.jpg',
                    text        : options[planPrefix+'PLANTEKST'+indexStr] || '',
                    info        : options[planPrefix+'PLAN_INFO'+indexStr] || '',
                    date        : options[planPrefix+'PLAN'+indexStr+'_OPDATERET'] || ''
                });
window.niels++;
            }


        }
    };

    nsHL.Location.prototype = {
        setup: {
            id2OptionsId : {}, //{id:ID} where id is this and ID is in options. Eq. {"id": "BRO_ID"}
            planPrefix   : '', //STRING - Prefix for options-ids with info on plans for the location
            pdfUrl       : '', //STRING
            photoUrlMask : '', //STRING. If given it must contain <FILENAME>
            planUrlMask  : '', //STRING. If given it must contain <FILENAME>
            brolysUrlMask: '', //STRING. If given it must contain <FILENAME>
            optionsFunc : function(/*options*/){} //Adjust options
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
                        bsMarkerOptions,
                        this.markerOptions()
                    );
        },

        /*****************************************
        _photoPlanUrl
        *****************************************/
        _photoPlanUrl: function(fileName, urlMask){
            return urlMask ? urlMask.replace('<FILENAME>', fileName) : ns.dataFilePath(true, this.parent.options.subDir, "photos_and_plans/") + fileName;
        },

        /*****************************************
        photoUrl
        *****************************************/
        photoUrl: function(index){
            return index < this.photoList.length ? this._photoPlanUrl( this.photoList[index].fileName, this.setup.photoUrlMask ) : '';
        },

        /*****************************************
        planUrl
        *****************************************/
        planUrl: function(index){
            return index < this.planList.length ? this._photoPlanUrl( this.planList[index].fileName, this.setup.planUrlMask ) : '';
        },

        /*****************************************
        showPdf
        *****************************************/
        showPdf: function(){
            $.bsModalFile(
                this.setup.pdfUrl.replace('<ID>', this.id),
                {header: this.header}
            );
        },

        /*****************************************
        createMarker
        *****************************************/
        createMarker: function(){
            var this_show = $.proxy(this.showPdf, this);

            return L.bsMarkerCircle( this.latLng, this.getMarkerOptions() )
                        .bindPopup({
//HER                            flexWidth: true,
                            fixable : true,

                            //noVerticalPadding  :  true,
                            //noHorizontalPadding: true,

                            onNew  : this_show,
                            header : this.header,

                            maxHeight: 260,
                            width    : 260,
                            content  : $.proxy(this.content_popup, this),

                            extended: {
                                maxHeight: 600,
                                width    : 600,
                                content  : $.proxy(this.content_popup_extended, this),
                                footer   : true
                            },

                            buttons:[{
                                id     :'dhl_show'+this.id,
                                //icon   : $.bsNotyIcon.info,
                                icon   : 'far fa-file-pdf',
                                text   : ['abbr:gst', {da: 'officielle version', en:'Official Version'}],
                                onClick: this_show
                            }],
                            footer: [{icon: 'fa-copyright', text: ['name:gst', '320-0088'], link: ['link:gst', 'link:gst']}, {text: ['(','abbr:gst',')'], textClass:['mr-0','mr-0']}]
                        });
        },


        /*****************************************
        content_popup
        *****************************************/
        content_popup: function($body, popup/*,map*/){
            var url = this.photoUrl(0) || this.planUrl(0);
            if (url)
                $('<img src="' + url + '" style="cursor: pointer; max-width:100%; max-height:100%"/>')
                    .i18n(this.name, 'title')
                    .on('click', function(){
                        popup.$contentNode._bsModalSetSize( $.MODAL_SIZE_EXTENDED );
                    })
                    .appendTo($body);
            else
                $('<div/>')._bsAddHtml({text:{da:'MANGLER', en:'NOT READY'}}).appendTo($body);



        },


        /*****************************************
        content_popup_extended
        *****************************************/
        content_popup_extended: function($body, popup/*,map*/){
            var url = this.photoUrl(0) || this.planUrl(0);
            if (url)
                $('<img src="' + url + '" style="cursor: pointer; max-width:100%; max-height:100%"/>')
                    .i18n(this.name, 'title')
                    .on('click', function(){
                        popup.$contentNode._bsModalSetSize( $.MODAL_SIZE_NORMAL );
                    })
                    .appendTo($body);
            else
                $('<div/>')._bsAddHtml({text:{da:'MANGLER', en:'NOT READY'}}).appendTo($body);



        },

    };
}(jQuery, L, this.i18next, this.moment, this, document));



