/****************************************************************************
facilities.js

****************************************************************************/

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
                { id: 'GRILL',         icon: 'fai fai-barbecue2 font-weight-bold',  text: {da: 'Grillplads', en:'Barbecue area'} },
                { id: 'LEGEPL',        icon: 'fai fai-child font-weight-bolder',    text: {da: 'Legeplads', en:'Playground'} }, // or fai-playground(2)
                { id: 'RESTAU',        icon: 'far fa-utensils',     text: {da: 'Restaurant', en:'Restaurant'} },
                { id: 'SURF',          icon: 'fai fai-wind-surfing font-weight-bold',   text: {da: 'Surfing', en:'Surfing'} }, //or fai fa-surfing-board(2)
                { id: 'INFO',          icon: 'far fa-info',         text: {da: 'Turistinformation', en:'Tourist Information'} }
            ]
        },{
            text: {da:'Service', en:'Service'},
            list: [
                { id: 'KRAN',          icon: 'fai fai-hook',    text: {da: 'Kran', en:'Crane'} },
                { id: 'SLIP',          icon: 'fai fai-slipway', text: {da: 'Slip/bedding/travelift/slæbested', en:'Travelift/Slipway'} },
                { id: 'VARKSTED',      icon: 'far fa-wrench',   text: {da: 'Værksted/værf', en:'Workshop/Shipyard'} },
            ]
        },{
            text: {da:'Proviantering', en:'Provisioning'},
            list: [
                { id: 'BENZIN',        icon: 'far fa-gas-pump',                         text: {da: 'Benzin/diesel/olie', en:'Petrol/Diesel/Oil'} },
                { id: 'GAS',           icon: 'fai fai-gas-cylinder font-weight-bold',   text: {da: 'Flaskegas', en:'Bottled gas'} }, //or fai fa-gas-cylinder2-4
                { id: 'KIOSK',         icon: 'far fa-shopping-basket',                  text: {da: 'Kiosk/købmand/proviant', en:'Kiosk/Grocery/Provisions'} }, //or fa-shopping-cart
                { id: 'PROVIANT',      icon: '', /*<-- TODO/MANGLER*/                   text: {da: 'Skibsproviantering', en:'Provisions'} },
            ]
        },{
            text: {da:'Transport og Kommunikation', en:'Transport and Communication'},
            list: [
                { id: 'BUS',           icon: 'far fa-bus',      text: {da: 'Busforbindelse', en:'Bus Connection'} },
                { id: 'FARGE',         icon: 'fai fai-ferry2',  text: {da: 'Færgeforbindelse', en:'Ferry Connection'} }, //or fa-ferry
                { id: 'POST',          icon: 'far fa-envelope', text: {da: 'Posthus', en:'Postoffice'} },
                { id: 'TELE',          icon: 'far fa-phone',    text: {da: 'Telefon', en:'Telephone'} },
                { id: 'TOG',           icon: 'far fa-train',    text: {da: 'Togforbindelse', en:'Train Connection'} },
            ]
        }];

}(jQuery, L, this.i18next, this.moment, this, document));



