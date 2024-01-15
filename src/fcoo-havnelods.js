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