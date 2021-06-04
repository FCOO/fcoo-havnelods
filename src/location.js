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



