import { Injectable } from '@angular/core';
import { Constants } from 'app/constants';
import { forEach } from '@angular/router/src/utils/collection';
import { GMap } from '../models/Map';
import { Road, Coordinate, Direction, ServerRoad } from '../models/Road';
import { UtilityService } from '../../shared/services/utility.service';
import { FormsModule } from '@angular/forms';
import { Handler } from 'tapable';
import { SecurityService } from '../../shared/services/security.service';
import { DataService } from '../../shared/services/data.service';
import { environment } from '../../../environments/environment';
import { GoogleRoadIcon } from '../models/Icon';
declare let google: any;
declare var jquery: any;
declare var $: any;
let GLOBAL = {
    snapPoints: [],
    GmapService: null,
    isSnapEnable: false,
    oldMarker: null,
    isRoadsTableEnable: false,
    isCommentIconTableEnable: false,
    gmapTimer: null,
    addIconPoint: false,
    currentNumberRow: 0
};
@Injectable()
export class GmapService {
    claims = [];
    ApiRoadUrl = environment.API_ENDPOINT + Constants.ADDROAD;
    ApiMapUrl = environment.API_ENDPOINT + Constants.MAP;
    ApiGoogleRoadIconUrl = environment.API_ENDPOINT + Constants.GOOGLE_ROADICON;
    directionsDisplay: any;
    directionsService: any;
    polyroadroutes = [];
    routeMarkersLatLng = [];
    routeMarkers = [];
    geocoder: any;
    gmap: GMap;
    drawMode = {
        Default: false,
        SnapMode: true
    };
    modifiedRoads = [];
    currentRoad: Road;
    Popup: any;
    inforWindows = [];
    commentIcons = [];
    roadIcons = [];
    dialogType = { deleteRoad: 100, deleteIcon: 101 };
    directionResponses: any; // bien luu tru 2 tuyen duong kha thi giua 2 toa do
    constructor(private dataService: DataService, private utilityService: UtilityService, private authService: SecurityService) { }

    public initGoogleMap(obj) {
        this.claims = this.authService.getClaim();
        this.gmap = new GMap(obj[0].id, obj[0].type, obj[0].googleRoads, obj[0].commentIcons, null, false, false, false);

        if (this.claims.indexOf(Constants.mapEdit) > -1) {
            this.gmap.editPermission = true;
        } else {
            this.gmap.editPermission = false;
        }
        if (this.claims.indexOf(Constants.mapAdd) > -1) {
            this.gmap.addPermission = true;
        } else {
            this.gmap.addPermission = false;
        }
        if (this.claims.indexOf(Constants.mapDelete) > -1) {
            this.gmap.deletePermission = true;
        } else {
            this.gmap.deletePermission = false;
        }
        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer();

        this.gmap.controller = new google.maps.Map(document.getElementById('gmap'), {
            center: { lat: 21.027884, lng: 105.833974 },
            zoom: 7,
            gestureHandling: 'greedy',
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.VERTICAL_BAR, //HORIZONTAL_BAR,
                position: google.maps.ControlPosition.RIGHT_TOP
            },
            fullscreenControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            }

        });

        this.addCommentIcon(this.gmap.commentIcons);

        if (this.gmap.roads.length && this.gmap.roads.length > 0) {
            var bounds = new google.maps.LatLngBounds();
            this.gmap.roads.forEach(function (road) {
                bounds.extend(new google.maps.LatLng(Number(road.paths[0].lat), Number(road.paths[0].lng)));
                bounds.extend(new google.maps.LatLng(Number(road.paths[road.paths.length - 1].lat), Number(road.paths[road.paths.length - 1].lng)));
            });
            this.gmap.controller.fitBounds(bounds);
            // var temp = bounds.getCenter();
            // this.gmap.controller.setCenter(temp);
            // this.gmap.controller.setZoom(17);
        }
        GLOBAL.GmapService = this;

        let mother = this;
        this.gmap.controller.addListener('click', function (event) {
            if (!GLOBAL.isSnapEnable) {
                for (let i = 0; i < mother.routeMarkers.length; i++) {
                    mother.routeMarkers[i].setMap(null);
                }
            }
            for (var i = 0; i < mother.inforWindows.length; i++) {
                mother.inforWindows[i].setMap(null);
            }
        });
        this.geocoder = new google.maps.Geocoder();
        this.directionsDisplay = new google.maps.DirectionsRenderer();
        this.directionsDisplay.setMap(this.gmap.controller);
        this.directionResponses = [];
        this.gmap.roads.forEach(road => {
            this.drawRoute(road, this.drawMode.Default);
        });
        this.gmap.controller.setOptions({ draggableCursor: 'default' });
        this.initPanelControl();
        this.loadRoadIcon();
    }

    private loadRoadIcon() {
        this.gmap.roads.forEach(road => {
            if (road.googleRoadIcons.length > 0) {
                road.googleRoadIcons.forEach(i => {
                    var image = {
                        anchor: new google.maps.Point(10, 10), //16: center of 32x32 image
                        origin: new google.maps.Point(0, 0),
                        scaledSize: new google.maps.Size(20, 20),
                        size: new google.maps.Size(20, 20),
                        url: i.url
                    };
                    var iconMark = new google.maps.Marker({
                        position: new google.maps.LatLng(i.lat, i.lng),
                        draggable: true,
                        map: this.gmap.controller,
                        icon: image,
                        id: i.id,
                        roadId: road.id
                        // anchor: new google.maps.Point(5, 30)
                    });
                    var mother = this;
                    var newIcon = new GoogleRoadIcon(i.id, i.descriptions, i.url, i.googleRoadId, i.lat, i.lng, i.location);
                    iconMark.addListener('click', function (event) {
                        var lat = event.latLng.lat();
                        var lng = event.latLng.lng();
                        mother.showInfoWindow(i.descriptions, road, this, event, newIcon);
                    })
                    this.roadIcons.push(iconMark);
                });
            }

        });
    }

    private setCenter(lat: number, lng: number) {
        this.gmap.controller.setOptions({
            center: {
                lat,
                lng
            }
        });
    }

    private addCommentIcon(icons) {
        var desControl = document.getElementById('gmap-description');
        desControl.style.display = 'block';
        desControl.style.fontSize = '14px';
        desControl.innerHTML = `${icons.map(d => `&nbsp<a style="font-size:14px">
        <img src=${d.url} width="15" height="15"> 
        </a>${d.descriptions}`)}`;
    }

    private initPanelControl() {
        this.gmap.controller.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('gmap-ctrl0'));
        // this.gmap.controller.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('gmap-description'));
        this.gmap.controller.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('gmap-ctrl-commentIcon-ctrl'));
        this.gmap.controller.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('gmap-ctrl1'));
        this.gmap.controller.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('gmap-ctrl2'));
        this.gmap.controller.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('gmap-ctrl3'));
        document.getElementById('gmap-btn-loadMore').style.display = 'none';
        document.getElementById('gmap-description').style.display = 'none';
        document.getElementById('gmap-ctrl-commentIcon-ctrl').style.display = 'none';
        document.getElementById("gmap-btnDescription").style.display = 'none';
        if (this.gmap.commentIcons.length > 1 && !window.matchMedia('screen and (max-width: 768px)').matches) {
            document.getElementById('gmap-description').style.display = 'block';
        }



        if (!this.gmap.editPermission) {
            document.getElementById('gmap-btnSaveChange').style.display = 'none';
        }

        if (!this.gmap.addPermission) {
            document.getElementById('gmap-setPoint').style.display = 'none';
            document.getElementById('gmap-addIconPoint').style.display = 'none';
        }else{
            document.getElementById('gmap-setPoint').style.display = 'block';
            document.getElementById('gmap-addIconPoint').style.display = 'block';
        }

        if (this.gmap.commentIcons.length > 0) {
            this.gmap.commentIcons.forEach(icon => {
                $('#gmap-iconType').append($('<option>', {
                    value: icon.url,
                    text: icon.descriptions
                }));
                $('#gmap-iconType').on('change', function () {
                    $('#gmap-icon-img').attr("src", this.value);
                });
            });
        }

        document.getElementById('gmap-btnSaveChange').addEventListener('click', function () {
            var modifiedRoads = GLOBAL.GmapService.modifiedRoads;
            if (modifiedRoads.length > 0) {

                var loading = document.getElementById('gmap-wait');
                loading.innerHTML = "<p><b><font size='3'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";

                var data = [];
                modifiedRoads.forEach(road => {
                    var newRoad = new ServerRoad(road.id, null, road.distance, road.color, road.name, road.direction, GLOBAL.GmapService.gmap.id);
                    var paths = '';
                    road.paths.forEach(path => {
                        paths += path.lat + ',' + path.lng + ';';
                    });
                    newRoad.paths = paths;
                    data.push(newRoad);
                });

                GLOBAL.GmapService.dataService.put(GLOBAL.GmapService.ApiRoadUrl + '/-1', data).subscribe((res: Response) => {
                    let results = res['result'];
                    GLOBAL.GmapService.modifiedRoads = [];
                    console.log(results);
                    loading.innerHTML = "";
                });
            }
        });

        document.getElementById('gmap-resetView').addEventListener('click', function () {
            let bounds = new google.maps.LatLngBounds();
            GLOBAL.GmapService.gmap.roads.forEach(road => {
                bounds.extend(new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng));
                bounds.extend(new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng));
            });
            GLOBAL.GmapService.routeMarkers.forEach(marker => {
                marker.setMap(null);
            });
            GLOBAL.GmapService.gmap.controller.fitBounds(bounds);
            var table = document.getElementById("gmapRoadsTable");
            $('#gmapRoadsTable > tbody > tr').each(function (i) {
                this.style.backgroundColor = '#fff';
            });
            GLOBAL.GmapService.inforWindows.forEach(function (infoWin) {
                infoWin.setMap(null);
            })
        });

        var mother = this;

        document.getElementById('gmap-ctrl3').style.display = 'none';
        var addIconPointControl = document.getElementById('gmap-addIconPoint');
        addIconPointControl.addEventListener('click', function () {
            if (!GLOBAL.addIconPoint) {
                GLOBAL.addIconPoint = true;
                document.getElementById('gmap-ctrl3').style.display = 'block';
                document.getElementById('gmap-ctrl3').innerHTML = `<p><strong>Please click on route where you want to add icon ...</strong></p>`;
            } else {
                document.getElementById('gmap-ctrl3').style.display = 'none';
                document.getElementById('gmap-ctrl3').innerHTML = ``;
                GLOBAL.addIconPoint = false;
            }
        });

        var setPointControl = document.getElementById('gmap-setPoint');

        setPointControl.addEventListener('click', function (event) {
            if (GLOBAL.isSnapEnable) {
                GLOBAL.GmapService.gmap.controller.setOptions({ draggableCursor: 'default' });
                GLOBAL.isSnapEnable = false;
                return;
            }
            GLOBAL.isSnapEnable = true;
            GLOBAL.GmapService.gmap.controller.setOptions({ draggableCursor: 'crosshair' });
        });

        this.gmap.controller.addListener('click', function (event) {
            var table = document.getElementById("gmapRoadsTable");
            $('#gmapRoadsTable > tbody > tr').each(function (i) {
                this.style.backgroundColor = '#fff';
            });
            if (!GLOBAL.isSnapEnable) {
                return;
            }
            if (GLOBAL.snapPoints.length < 2) {
                let marker = new google.maps.Marker({
                    position: event.latLng,
                    map: GLOBAL.GmapService.gmap.controller,
                    title: '(lat: ' + event.latLng.lat() + '; lng: ' + event.latLng.lng() + ')'
                });
                GLOBAL.GmapService.routeMarkers.push(marker);
                if (marker) {
                    GLOBAL.snapPoints.push(event.latLng);
                    if (GLOBAL.snapPoints.length == 2) {
                        GLOBAL.isSnapEnable = false;

                        GLOBAL.GmapService.gmap.controller.setOptions({ draggableCursor: 'default' });
                        let newRoad = new Road(
                            null,
                            [
                                new Coordinate(GLOBAL.snapPoints[0].lat(), GLOBAL.snapPoints[0].lng()),
                                new Coordinate(GLOBAL.snapPoints[GLOBAL.snapPoints.length - 1].lat(), GLOBAL.snapPoints[GLOBAL.snapPoints.length - 1].lng())
                            ],
                            0,
                            "",
                            "",
                            "",
                            []
                        );
                        // GLOBAL.GmapService.gmap.roads.push(newRoad);
                        var loading = document.getElementById('gmap-wait');
                        loading.innerHTML = "<p><b><font size='3'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
                        GLOBAL.GmapService.drawRoute(newRoad, GLOBAL.GmapService.drawMode.SnapMode);
                        GLOBAL.snapPoints = [];
                    }
                }
            }
            // GLOBAL.GmapService.createMaker('(lat: '+event.latLng.lat()+'; lng: '+event.latLng.lng()+')', event.latLng);
        });

        document.getElementById('gmap-ctrl1').style.display = 'none';
        var buttonControl = document.getElementById('gmap-btnShowDetail');
        var searchPanel = document.getElementById('gmap-searchPanel');

        var mother = this;
        buttonControl.addEventListener('click', function () {
            if (!GLOBAL.isRoadsTableEnable) {
                let gmapControl = document.getElementById('gmap-ctrl1');
                gmapControl.style.display = 'block';
                GLOBAL.isRoadsTableEnable = true;
            } else {
                let gmapControl = document.getElementById('gmap-ctrl1');
                gmapControl.style.display = 'none';
                GLOBAL.isRoadsTableEnable = false;
            }
        });

        var resultContext = document.createElement('p');
        resultContext.id = 'gmap-resultsCount';
        resultContext.style.fontWeight = 'bold';
        resultContext.style.fontSize = '11pt';
        resultContext.style.marginTop = '10px';
        resultContext.style.marginBottom = '10px';
        resultContext.align = 'center';
        searchPanel.appendChild(resultContext);
        mother.bindingTable();

        if (!window.matchMedia('screen and (max-width: 768px)').matches) {
            var gmapControl = document.getElementById('gmap-ctrl1');
            document.getElementById("gmap-searchPanel").style.width = '300px';
            document.getElementById("gmapRoadTableDiv").style.width = '300px';
            document.getElementById("gmap-btnShowDetail").style.display = 'none';
            gmapControl.style.display = 'block';
            GLOBAL.isRoadsTableEnable = true;
        } else {
            document.getElementById("gmap-searchPanel").style.width = '280px';
            document.getElementById("gmapRoadTableDiv").style.width = '280px';
            document.getElementById("gmap-btnDescription").style.display = 'block';
            document.getElementById("gmap-btnShowDetail").style.display = 'block';
            var commentIconsElement = document.getElementById('gmap-description');
            commentIconsElement.innerHTML = ``;
            var mother = this;

            $(`#gmap-btnDescription`).click(function () {
                mother.showCommentIconTable();
                if (!GLOBAL.isCommentIconTableEnable) {
                    let gmapControl = document.getElementById('gmap-ctrl-commentIcon-ctrl');
                    gmapControl.style.display = 'block';
                    GLOBAL.isCommentIconTableEnable = true;
                } else {
                    let gmapControl = document.getElementById('gmap-ctrl-commentIcon-ctrl');
                    gmapControl.style.display = 'none';
                    GLOBAL.isCommentIconTableEnable = false;
                }
            });
        }
        document.getElementById('gmap-txtSearch').addEventListener("keyup", function (event) {

            clearTimeout(GLOBAL.gmapTimer);
            var ms = 1000; // milliseconds
            var val = $('#gmap-txtSearch').val();//document.getElementById('gmap-txtSearch').value;
            GLOBAL.gmapTimer = setTimeout(function () {
                var results = [];
                var table = document.getElementById('gmapRoadsTable');
                table.style.cursor = 'pointer';
                var theadEl = table.getElementsByTagName('thead')[0];
                var tbody = table.getElementsByTagName('tbody')[0];
                tbody.innerHTML = '';
                theadEl.innerHTML = '';
                var roads = GLOBAL.GmapService.gmap.roads;

                if (!val) {
                    GLOBAL.currentNumberRow = 0;
                    mother.bindingTable();
                } else {
                    mother.bindingTable(val);
                }


                // resultsControl.innerHTML = results;
            }, ms);
        });

    }

    private showCommentIconTable() {
        document.getElementById('gmap-ctrl-commentIcon').style.display = 'block';
        var table = document.getElementById('gmap-commnetIconTable');
        var tbody = table.getElementsByTagName('tbody')[0];
        tbody.innerHTML = '';
        this.gmap.commentIcons.forEach(icon => {
            var newRow = tbody.insertRow(tbody.rows.length);
            newRow.insertCell(0).innerHTML = `&nbsp<a style="font-size:14px">
            <img src=${icon.url} width="15" height="15"> 
            </a>`;
            newRow.insertCell(1).innerHTML = icon.descriptions;
        });
    }

    private bindingTable(searchText?: string) {
        var url = this.ApiRoadUrl + '/from/' + this.gmap.id + '/' + GLOBAL.currentNumberRow;
        if (searchText) {
            url = this.ApiRoadUrl + '/search/' + searchText + '/' + this.gmap.id;
        }
        document.getElementById('gmap-ctrl1').style.height = '410px';
        this.dataService.get(url).subscribe((res: Response) => {
            let results = res['result'];
            if (results.length <= 0) {
                // document.getElementById('gmap-resultsCount').innerHTML = "No result found.";
            } else {
                GLOBAL.currentNumberRow += results.length;
                var table = document.getElementById('gmapRoadsTable');
                table.style.cursor = 'pointer';
                var theadEl = table.getElementsByTagName('thead')[0];
                var tbody = table.getElementsByTagName('tbody')[0];
                tbody.innerHTML = '';
                var th1 = document.createElement('th');
                th1.innerHTML = '';
                th1.width = '40px';
                theadEl.appendChild(th1);
                var th2 = document.createElement('th');
                // th2.innerHTML = "Direction";
                theadEl.appendChild(th2);

                let roads = [];
                results.forEach(e => {
                    let newRoad = new Road(e.id, null, e.distance, e.color, e.name, e.direction, e.googleRoadIcons);
                    let pathData = e.paths.split(';');
                    let paths = [];

                    pathData.forEach(p => {
                        if (p) {
                            let coord = new Coordinate(Number(p.split(',')[0]), Number(p.split(',')[1]));
                            paths.push(coord);
                        }
                    });
                    newRoad.paths = paths;
                    roads.push(newRoad)
                });
                if (searchText)
                    this.GetDataFromServer(roads, searchText);
                else
                    this.GetDataFromServer(roads);
            }
        });
    }

    private GetDataFromServer(data, searchText?: string) {
        var btnLoadMore = document.getElementById('gmap-btn-loadMore');
        var mother = this;
        if (data.length >= 5 && !searchText) {
            document.getElementById('gmap-ctrl1').style.height = '410px';
            btnLoadMore.style.display = "block";
        } else {
            document.getElementById('gmap-ctrl1').style.height = 'auto';
            btnLoadMore.style.display = "none";

        }
        mother.bindData(data);
        btnLoadMore.addEventListener('click', function () {
            var url = mother.ApiRoadUrl + '/from/' + mother.gmap.id + '/' + GLOBAL.currentNumberRow;
            if (searchText) {
                url = mother.ApiRoadUrl + '/search/' + searchText + '/' + mother.gmap.id;
            }
            document.getElementById('gmap-btn-loadMore').innerText = '... Loading ...';
            mother.dataService.get(url).subscribe((res: Response) => {
                document.getElementById('gmap-btn-loadMore').innerText = 'Load More';
                let results = res['result'];
                if (results.length <= 0) {
                } else {
                    GLOBAL.currentNumberRow += results.length;
                    let roads = [];
                    results.forEach(e => {
                        let newRoad = new Road(e.id, null, e.distance, e.color, e.name, e.direction, e.googleRoadIcons);
                        let pathData = e.paths.split(';');
                        let paths = [];

                        pathData.forEach(p => {
                            if (p) {
                                let coord = new Coordinate(Number(p.split(',')[0]), Number(p.split(',')[1]));
                                paths.push(coord);
                            }
                        });
                        newRoad.paths = paths;
                        roads.push(newRoad)
                    });
                    mother.bindData(roads);
                    if (data.length >= 5 && !searchText) {
                        document.getElementById('gmap-ctrl1').style.height = '420px';
                        btnLoadMore.style.display = "block";
                    } else {
                        document.getElementById('gmap-ctrl1').style.height = 'auto';
                        btnLoadMore.style.display = "none";
            
                    }
                    document.getElementById('gmapRoadTableDiv').scrollTop = document.getElementById('gmapRoadTableDiv').scrollHeight;
                }
            });
        });
        
    }

    private bindData(data){
        var table = document.getElementById('gmapRoadsTable');
        table.style.cursor = 'pointer';
        var theadEl = table.getElementsByTagName('thead')[0];
        var tbody = table.getElementsByTagName('tbody')[0];
        var mother = this;
        data.forEach(function (road) {
            var newRow = tbody.insertRow(tbody.rows.length);
            newRow.insertCell(0).innerHTML = '<img id="detail-icon-img" src="https://cdn1.iconfinder.com/data/icons/free-98-icons/32/map-marker-20.png" alt="map, marker icon" width="15" height="15">';
            newRow.insertCell(1).innerHTML = String(road.direction);

            newRow.insertCell(2).innerHTML = `<input id=${road.id} class="roadId" id="${road.id}" style="border:none" value="${road.id}"/>`;
            newRow.cells[2].style.display = "none";

            newRow.cells[0].align = 'center';
            newRow.cells[0].vAlign = 'middle';
            newRow.addEventListener('click', function (event) {
                //console.log(road.id);
                var table = document.getElementById("gmapRoadsTable");
                $('#gmapRoadsTable > tbody > tr').each(function (i) {
                    this.style.backgroundColor = '#fff';
                });
                // for (var i = 0, row; row = table.rows[i]; i++) {
                //     row.style.backgroundColor = '#fff';
                // }
                this.style.backgroundColor = '#ddd';
                var bounds = new google.maps.LatLngBounds();
                for (var j = 0, path = road.paths; j < path.length; j++) {
                    var latLng = path[j];
                    bounds.extend(latLng);
                }
                var polyroutes = GLOBAL.GmapService.polyroadroutes;
                polyroutes.forEach(function (route) {
                    var id = route.get('id');
                    if (id == road.id) {
                        GLOBAL.GmapService.routeMarkers.forEach(function (marker) {
                            marker.setMap(null);
                        });
                        if (mother.gmap.editPermission) {
                            // if (i == 0 || i == road.paths.length - 1) {
                            var mark = GLOBAL.GmapService.createMaker('', new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng), road, mother.gmap.editPermission);
                            var mark2 = GLOBAL.GmapService.createMaker('', new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng), road, mother.gmap.editPermission);
                            // mark.addListener('click', function () {
                            //     mother.showInfoWindow('', road, mark, {
                            //         latLng: new google.maps.LatLng(road.paths[i].lat, road.paths[i].lng)
                            //     });
                            // });
                            mother.routeMarkers.push(mark);
                            mother.routeMarkers.push(mark2);
                            // }
                            // for (var i = 0; i < road.paths.length; i++) {
                            //     _loop_1();
                            // }
                        }

                        var rndNumber = Math.floor((Math.random() * (road.paths.length - 2)) + 1);
                        var latLngs = {
                            latLng: new google.maps.LatLng(road.paths[rndNumber].lat, road.paths[rndNumber].lng)
                        };
                        GLOBAL.GmapService.showInfoWindow("", road, false, latLngs);
                    }
                });
                var temp = bounds.getCenter();
                GLOBAL.GmapService.gmap.controller.setCenter(temp);
                GLOBAL.GmapService.gmap.controller.setZoom(17);
            });
        });
    }

    private drawRoute(road: Road, isSnapMode: boolean, isModified?: boolean) {
        if (!isSnapMode) {
            this.shortenAndShow(false, road);
        } else {
            let destCoodrs = [
                new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng),
                new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng)
            ];
            let waypts = [];
            destCoodrs.forEach(coodr => {
                waypts.push({ location: coodr, stopover: true });
            });

            this.directionsDisplay.setMap(this.gmap.controller);
            let request = {
                origin: destCoodrs[0],
                destination: destCoodrs[destCoodrs.length - 1],
                waypoints: waypts,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            let mother = this;
            setTimeout(() => {
                this.directionsService.route(request, function (response, status) {
                    if (isModified)
                        mother.directionsearch(response, status, destCoodrs, road, isSnapMode, isModified);
                    else
                        mother.directionsearch(response, status, destCoodrs, road, isSnapMode);
                });
            }, 1000);
        }
    }

    private directionsearch(response: any, status: string, destCoodrs: Array<any>, road: Road, isSnapMode: boolean, isModified?: boolean) {
        let mother = this;
        if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
            console.log("OVER_QUERY_LIMIT");
            setTimeout(() => {
                mother.drawRoute(road, mother.drawMode.SnapMode);
            }, 1000);
        } else {
            if (status == google.maps.DirectionsStatus.OK) {
                let currentResponses = [];
                for (var i = 0; i < mother.directionResponses.length; i++) {
                    if (mother.directionResponses[i].id == road.id) {
                        currentResponses.push(mother.directionResponses[i]);
                    }
                }
                if (currentResponses.length < 2) {
                    mother.directionResponses.push({ id: road.id, response: response });
                    currentResponses.push({ id: road.id, response: response });
                    if (currentResponses.length < 2) {
                        let newPaths = [];
                        for (var i = road.paths.length - 1; i >= 0; i--) {
                            newPaths.push(road.paths[i]);
                        }
                        setTimeout(() => {
                            mother.drawRoute(new Road(road.id, newPaths, 0, road.color, road.name, road.direction, road.googleRoadIcons), mother.drawMode.SnapMode, isModified);
                        }, 10);
                    } else {
                        let distance1: number = currentResponses[0].response.routes[0].legs[1].distance.value;
                        let distance2: number = currentResponses[1].response.routes[0].legs[1].distance.value;
                        let correctRoadResponse: any;
                        if (distance1 < distance2) {
                            road.distance = distance1;
                            correctRoadResponse = currentResponses[0].response;
                        } else {
                            road.distance = distance2;
                            correctRoadResponse = currentResponses[1].response;
                        }
                        mother.directionResponses = [];
                        //let duration = parseFloat(response.routes[0].legs[0].duration.value / 3600).toFixed(2);

                        let route_latlngs: string;
                        if (correctRoadResponse.routes) {
                            route_latlngs = correctRoadResponse.routes[0].overview_path;
                        } else {
                            route_latlngs = JSON.parse(correctRoadResponse);
                        }
                        mother.shortenAndShow(route_latlngs, road, isModified);
                    }
                }
            } else {
                if (status == "NOT_FOUND" || status == "ZERO_RESULTS") {
                    console.log("Route NOT_FOUND, so shortenAndTryAgain");
                }
            }
        }
    }

    private shortenAndShow(overview_pathlatlngs: any, road: Road, isModified?: boolean) {
        var perimeterPoints = Array();
        //loop through each leg of the route
        if (overview_pathlatlngs) {
            var loading = document.getElementById('gmap-wait');
            loading.innerHTML = "";
            for (var i = 0, _a = this.routeMarkers; i < _a.length; i++) {
                var marker = _a[i];
                marker.setMap(null);
            }
            this.routeMarkers = [];
            this.routeMarkersLatLng = [];
            road.paths = [];
            for (var j = 0; j < overview_pathlatlngs.length; j++) {
                var lat = overview_pathlatlngs[j].lat;
                if (typeof lat !== "number") {
                    lat = overview_pathlatlngs[j].lat();
                }
                var lng = overview_pathlatlngs[j].lng;
                if (typeof lng !== "number") {
                    lng = overview_pathlatlngs[j].lng();
                }
                road.paths.push(new Coordinate(lat, lng));
                if (j == 0 || j == overview_pathlatlngs.length - 1) {
                    this.routeMarkersLatLng.push({
                        roadId: road.id,
                        latLng: new google.maps.LatLng(lat, lng)
                    });
                    var marker = this.createMaker('', new google.maps.LatLng(lat, lng), road, this.gmap.editPermission);
                    this.routeMarkers.push(marker);
                }
                perimeterPoints.push(new google.maps.LatLng(lat, lng));
            }
        } else {
            road.paths.forEach(function (path) {
                perimeterPoints.push(new google.maps.LatLng(path.lat, path.lng));
            });
        }

        road['mapId'] = this.gmap.id;
        var color;
        if (road.color == "") {
            color = this.utilityService.getRandomColor();
            road.color = color;
        }

        var mother = this;
        if (!road.direction) {
            this.geocoder.geocode({
                'latLng': perimeterPoints[0]
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        $('#gmap-txtRoadName').val(results[0].formatted_address);
                        $('#gmap-txtRoadDirection').val(results[0].formatted_address);
                        road.name = results[0].formatted_address;
                        road.direction = results[0].formatted_address;
                    }
                }
            });
            
            $('#gmap-modal-AddRoad').modal('show');

            $('#btn-addRoad-Save').off('click').click(function () { // off('click') loai bo click event da duoc binding truoc do
                $('#btn-addRoad-Save').prop('disabled', true);
                var directionText = $('#gmap-txtRoadDirection').val();
                var name = $('#gmap-txtRoadName').val();
                if (!directionText) {
                    $('#gmap-AddRoadMessage').text("Direction cannot be null or empty!");
                    $('#gmap-txtRoadDirection').focus();
                    return;
                }
                if (!name) {
                    $('#gmap-AddRoadMessage').text("Name cannot be null or empty!");
                    $('#gmap-txtRoadName').focus();
                    return;
                }
                $('#gmap-AddRoadMessage').text("");
                road.direction = directionText;
                road.name = name;
                var serverRoad = new ServerRoad(-1, null, road.distance, road.color, road.name, road.direction, road["mapId"]);
                var paths = '';
                for (var i = 0; i < road.paths.length; i++) {
                    paths += road.paths[i].lat + ',' + road.paths[i].lng + ';';
                }
                var url = environment.API_ENDPOINT + Constants.ADDROAD;
                serverRoad.paths = paths;

                var loading = document.getElementById('gmap-wait');
                loading.innerHTML = "<p><b><font size='3'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";

                mother.dataService.post(url, serverRoad).subscribe((res: Response) => {
                    let results = res['result'];
                    console.log(results);
                    road.id = results.id
                    mother.drawRouteOnMap(road, perimeterPoints, overview_pathlatlngs);
                    loading.innerHTML = "";
                    $('#btn-addRoad-Save').prop('disabled', false);
                });
                $('#gmap-modal-AddRoad').modal('hide');
            });

            $('#gmap-addRoad-close').click(function(){
                $('#gmap-modal-AddRoad').modal('hide');
            });
        } else {
            if (isModified)
                this.drawRouteOnMap(road, perimeterPoints, overview_pathlatlngs, isModified);
            else
                this.drawRouteOnMap(road, perimeterPoints, overview_pathlatlngs);
        }
    }

    private drawRouteOnMap(road, perimeterPoints, overview_pathlatlngs, isModified?: boolean) {
        var polyroadroute = new google.maps.Polyline({
            path: perimeterPoints,
            geodesic: true,
            strokeColor: road.color,
            strokeOpacity: 0.9,
            strokeWeight: 5
        });
        polyroadroute.set("id", road.id);
        var mother = this;
        polyroadroute.addListener('click', function (event) {
            if (GLOBAL.addIconPoint) {
                $('#gmap-modal-AddIcon').on('hidden.bs.modal', function () {
                    GLOBAL.addIconPoint = false;
                    document.getElementById('gmap-ctrl3').innerHTML = '';
                    document.getElementById('gmap-ctrl3').style.display = 'none';
                })
                $('#btn-addIcon-close').off('click').click(function(){
                    GLOBAL.addIconPoint = false;
                    document.getElementById('gmap-ctrl3').innerHTML = '';
                    document.getElementById('gmap-ctrl3').style.display = 'none';
                });
                $('#btn-addIcon-Save').off('click').click(function(){
                    mother.addIconOnRouteProcess(road, event.latLng);
                    GLOBAL.addIconPoint = false;
                    document.getElementById('gmap-ctrl3').innerHTML = '';
                    document.getElementById('gmap-ctrl3').style.display = 'none';
                    $('#gmap-modal-AddIcon').modal('hide');
                });

                $('#gmap-modal-AddIcon').modal('show');
            } else {
                var bounds = new google.maps.LatLngBounds();
                mother.routeMarkers.forEach(function (marker) {
                    marker.setMap(null);
                });
                this.routeMarkers = [];
                if (overview_pathlatlngs) {
                    mother.routeMarkersLatLng.forEach(function (marker) {
                        if (marker.roadId == road.id) {
                            var mark = mother.createMaker('', marker.latLng, road, mother.gmap.editPermission);
                            mark.addListener('click', function () {
                                mother.showInfoWindow('', road, mark, marker);
                            });
                            bounds.extend(marker.latLng);
                            mother.routeMarkers.push(mark);
                        }
                    });
                    overview_pathlatlngs = null;
                } else {
                    if (mother.gmap.editPermission) {
                        var mark1 = mother.createMaker('', new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng), road, mother.gmap.editPermission);
                        mark1.addListener('click', function () {
                            mother.showInfoWindow('', road, mark1, {
                                latLng: new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng)
                            });
                        });
                        var mark2 = mother.createMaker('', new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng), road, mother.gmap.editPermission);
                        mark2.addListener('click', function () {
                            mother.showInfoWindow('', road, mark2, {
                                latLng: new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng)
                            });
                        });
                        mother.routeMarkers.push(mark1);
                        mother.routeMarkers.push(mark2);
                    }
                }
                mother.showInfoWindow("", road, false, event);
            }
            // bounds.extend(new google.maps.LatLng(road.paths[0].lat, road.paths[0].lng));
            // bounds.extend(new google.maps.LatLng(road.paths[road.paths.length - 1].lat, road.paths[road.paths.length - 1].lng));
            // mother.gmap.controller.fitBounds(bounds);
        });

        var roadIds = [];
        for (var i = 0; i < this.gmap.roads.length; i++) {
            roadIds.push(this.gmap.roads[i].id);
            if (this.gmap.roads[i].id == road.id) {
                this.gmap.roads[i] = road;
            }
        }
        var isExist = false;
        for (var i = 0; i < roadIds.length; i++) {
            if (roadIds[i] == road.id) {
                isExist = true;
                break;
            }
        }
        if (!isExist) {
            this.gmap.roads.push(road);
            // console.log(this.modifiedRoads);
        }

        if (isModified) {
            var roadModifiedIds = [];
            for (var j = 0; j < this.modifiedRoads.length; j++) {
                roadModifiedIds.push(this.modifiedRoads[j].id);
                if (this.modifiedRoads[j].id == road.id) {
                    this.modifiedRoads[j] = road;
                    console.log(this.modifiedRoads);
                    break;
                }
            }
            var isRoadModExist = false;
            for (var k = 0; k < roadModifiedIds.length; k++) {
                if (roadModifiedIds[k] == road.id) {
                    isRoadModExist = true;
                    break;
                }
            }
            if (!isRoadModExist) {
                this.modifiedRoads.push(road);
                console.log(this.modifiedRoads);
            }
        }

        polyroadroute.setMap(this.gmap.controller);
        //add to the array of road routes
        this.polyroadroutes.push(polyroadroute);
    }

    private addIconOnRouteProcess(road, latLng) {
        var iconUrl = $('#gmap-iconType').val();// document.getElementById("gmap-iconType").value;
        var desct = $('#gmap-addIconDesct').val(); // document.getElementById("gmap-addIconDesct").value;

        if (!road.icons) {
            road.icons = [];
        }

        var urlIcon = null;
        this.gmap.commentIcons.forEach(icon => {
            if (icon.url == iconUrl) {
                urlIcon = icon.url;
            }
        });

        GLOBAL.addIconPoint = false;
        this.routeMarkers.forEach(marker => {
            marker.setMap(null);
        });

        var googleRoadsIcon = new GoogleRoadIcon(-1, desct, urlIcon, road.id, latLng.lat(), latLng.lng(), "");
        var loading = document.getElementById('gmap-wait');
        loading.innerHTML = "<p><b><font size='3'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
        var mother = this;
        this.dataService.post(this.ApiGoogleRoadIconUrl, googleRoadsIcon).subscribe((res: Response) => {
            let results = res['result'];
            if (results.id) {
                googleRoadsIcon.id = results.id;
                var image = {
                    anchor: new google.maps.Point(10, 10), //16: center of 32x32 image
                    origin: new google.maps.Point(0, 0),
                    scaledSize: new google.maps.Size(20, 20),
                    size: new google.maps.Size(20, 20),
                    url: googleRoadsIcon.url
                };
                var iconMark = new google.maps.Marker({
                    position: latLng,
                    draggable: true,
                    map: this.gmap.controller,
                    icon: image,
                    id: googleRoadsIcon.id,
                    roadId: road.id,
                    url: googleRoadsIcon.url
                    // anchor: new google.maps.Point(5, 30)
                });
                mother.roadIcons.push(iconMark);
                iconMark.addListener('click', function (event) {
                    var lat = event.latLng.lat();
                    var lng = event.latLng.lng();
                    mother.showInfoWindow(desct, road, this, event, googleRoadsIcon);
                })
                document.getElementById('gmap-ctrl3').innerHTML = '';
                document.getElementById('gmap-ctrl3').style.display = 'none';
            }
            loading.innerHTML = "";
        });
    }

    private showInfoWindow(text, road, marker, markerLatLng, icon?) {
        var str;
        var mother = this;
        this.geocoder.geocode({
            'latLng': markerLatLng.latLng
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    // road.direction = newDirect;
                    var rowsNum = 4;
                    var maxwidth = 300;
                    if (!window.matchMedia('screen and (max-width: 768px)').matches) {
                        maxwidth = 600;
                        rowsNum = 2;
                    }
                    if (icon) {
                        str = `<div class="row" style="margin-left: 5px">
                        <div class="col-md-12 col-xs-12">
                        <table class="table talbe-sm" >
                            <tr><th>Descriptions</th><td><input type="text" id="gmap-input-description-${icon.id}" style="border:none; width:100%;padding:0px;margin:0px" value="${icon.descriptions}" /></td></tr>
                                <tr><th>Location</th><td>
                                ${mother.gmap.editPermission ? `<textarea id="gmap-input-location-${icon.id}" type="text" rows="${rowsNum}" style="resize: none;border:none; width:100%;padding:0px;margin:0px">${icon.location ? icon.location : results[0].formatted_address}</textarea>` : `<p>${icon.location ? icon.location : results[0].formatted_address}</p>`}
                                </td></tr><tr><th>Lat</th><td>
                                ${mother.gmap.editPermission ? `<input id="gmap-input-lat-${icon.id}" type="text" style="border:none; width:100%;padding:0px;margin:0px" value="${icon.lat}" />` : `<p>${icon.lat}</p>`}</td></tr>
                                <tr><th>Lng</th><td>
                                ${mother.gmap.editPermission ? `<input id="gmap-input-lng-${icon.id}" type="text" style="border:none; width:100%;padding:0px;margin:0px" value="${icon.lng}" />` : `<p>${icon.lng}</p>`}
                                </td></tr>
                        </table>
                        </div>${mother.gmap.editPermission ? `<div class="col-md-2 col-xs-3"><a id="gmap-btnInfoSave" class="btn btn-sm btn-info m-btn m-btn--icon">
                        <span>
                            <i class="la la-save"></i>
                            <span>
                                Save
                            </span>
                        </span>
                    </a></div>` : ``}
                        ${mother.gmap.deletePermission ? `<div class="col-md-2 col-xs-3">
                        <a id="gmap-btnIconDelete" class="btn btn-sm btn-secondary m-btn m-btn--icon">
                            <span>
                                <i class="la la-trash"></i>
                                <span>
                                    Delete
                                </span>
                            </span>
                        </a>
                        </div>` : ``}
                        <hr>
                        <div class="col-md-12 col-xs-12"></div>
                        </div>`;
                    } else {
                        str = `<div class="row" style="margin-left: 5px">
                        <div class="col-md-12 col-xs-12"><p><strong>${text}</strong></p>
                        <table class="table talbe-sm" >
                                <tr><th>Location</th>
                                <td>
                                ${mother.gmap.editPermission ? `<textarea id="gmap-input-location-${road.id}" type="text" rows="${rowsNum}" style="resize: none;border:none; width:98%;padding:0px;margin:0px">${road.name ? road.name : results[0].formatted_address}</textarea>` : `<p>${road.name ? road.name : results[0].formatted_address}</p>`}
                                
                                </td>
                                </tr><tr><th>Direction</th><td>
                                ${mother.gmap.editPermission ? `<textarea id="gmap-input-direction-${road.id}" rows="${rowsNum}" type="text" style="resize: none;border:none; width:98%;padding:0px;margin:0px">${road.direction}</textarea>`:`<p>${road.direction}</p>`}</td></tr>
                        </table>
                        </div>${mother.gmap.editPermission ? `<div class="col-md-2 col-xs-3">
                        <a id="gmap-btnInfoSave" class="btn btn-sm btn-info m-btn m-btn--icon">
                            <span>
                                <i class="la la-save"></i>
                                <span>
                                    Save
                                </span>
                            </span>
                        </a>
                        </div>` : ``}
                        ${mother.gmap.deletePermission ? `<div class="col-md-2 col-xs-3">
                        <a id="gmap-btnRoadDelete" class="btn btn-sm btn-secondary m-btn m-btn--icon">
                            <span>
                                <i class="la la-trash"></i>
                                <span>
                                    Delete
                                </span>
                            </span>
                        </a>
                        </div>` : ``}
                        <hr>
                        <div class="col-md-12 col-xs-12"></div>
                        </div>`;
                    }

                    var infowindow = new google.maps.InfoWindow({
                        content: str, maxWidth: maxwidth
                    });
                    mother.inforWindows.forEach(inforwin => {
                        inforwin.setMap(null);
                    });
                    if (marker)
                        infowindow.open(mother.gmap.controller, marker);
                    else {
                        for (var _i = 0, _a = mother.inforWindows; _i < _a.length; _i++) {
                            var infoWin = _a[_i];
                            infoWin.setMap(null);
                        }
                        infowindow.setPosition(markerLatLng.latLng);
                        infowindow.open(mother.gmap.controller);
                    }
                    mother.inforWindows.push(infowindow);

                    $(`#gmap-input-location-${road.id}`).change(function () {
                        if (icon) {
                            icon.location = this.value;
                        } else {
                            road.name = this.value;
                            mother.addToModified(road);
                        }
                    });
                    $(`#gmap-input-direction-${road.id}`).change(function () {
                        road.direction = this.value;
                        mother.addToModified(road);
                    });

                    $(`#gmap-btnInfoSave`).click(function () {
                        if (icon) {
                            var loading = document.getElementById('gmap-wait');
                            loading.innerHTML = "<p><b><font size='3'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
                            icon.descriptions = $(`#gmap-input-description-${icon.id}`).val();
                            icon.lat = Number($(`#gmap-input-lat-${icon.id}`).val());
                            icon.lng = Number($(`#gmap-input-lng-${icon.id}`).val());
                            icon.location = $(`#gmap-input-location-${icon.id}`).val();
                            GLOBAL.GmapService.dataService.put(GLOBAL.GmapService.ApiGoogleRoadIconUrl + '/' + icon.id, icon).subscribe((res: Response) => {
                                if (res && res["error"]) {
                                    alert(res["error"]);
                                }
                                loading.innerHTML = '';
                            });
                        } else {
                            var modifiedRoads = GLOBAL.GmapService.modifiedRoads;
                            if (modifiedRoads.length > 0) {

                                var loading = document.getElementById('gmap-wait');
                                loading.innerHTML = "<p><b><font size='3'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";

                                var data = [];
                                modifiedRoads.forEach(road => {
                                    var newRoad = new ServerRoad(road.id, null, road.distance, road.color, road.name, road.direction, GLOBAL.GmapService.gmap.id);
                                    var paths = '';
                                    road.paths.forEach(path => {
                                        paths += path.lat + ',' + path.lng + ';';
                                    });
                                    newRoad.paths = paths;
                                    data.push(newRoad);
                                });

                                GLOBAL.GmapService.dataService.put(GLOBAL.GmapService.ApiRoadUrl + '/' + data[0].id, data).subscribe((res: Response) => {
                                    if (res["error"]) {
                                        alert(res["error"]);
                                        return;
                                    }
                                    GLOBAL.GmapService.gmap.roads.forEach(road => {
                                        if (road.id == data[0].id) {
                                            road.direction = data[0].direction;
                                        }
                                    });
                                    GLOBAL.GmapService.modifiTable(road);
                                    let results = res['result'];
                                    GLOBAL.GmapService.modifiedRoads = [];
                                    loading.innerHTML = "";
                                });
                            }
                        }
                    });
                    $('#gmap-btnRoadDelete').click(function () {
                        mother.ShowMessageDialog(mother.dialogType.deleteRoad, road, null);
                    });
                    $('#gmap-btnIconDelete').click(function () {
                        mother.ShowMessageDialog(mother.dialogType.deleteIcon, null, icon);
                    });
                }
            }
        });
    }

    private deleteRoad(road) {
        var loading = document.getElementById('gmap-wait');
        loading.innerHTML = "<p><b><font size='3'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
        GLOBAL.GmapService.dataService.delete(GLOBAL.GmapService.ApiRoadUrl + '/' + road.id).subscribe((res: Response) => {
            loading.innerHTML = "";
            if (res["success"]) {
                GLOBAL.GmapService.inforWindows.forEach(inforwin => {
                    inforwin.setMap(null);
                });
                GLOBAL.GmapService.routeMarkers.forEach(m => {
                    m.setMap(null);
                });
                GLOBAL.GmapService.roadIcons.forEach(icon => {
                    var id = icon.get('roadId');
                    if(id == road.id){
                        icon.setMap(null);
                    }
                });
                GLOBAL.GmapService.polyroadroutes.forEach(p => {
                    let id = p.get('id');
                    if (id == road.id) {
                        p.setMap(null);
                        GLOBAL.GmapService.polyroadroutes.splice(GLOBAL.GmapService.polyroadroutes.indexOf(p), 1);
                        GLOBAL.GmapService.deleteRowTable(road);
                    }
                });
            } else {
                let error = res['error'];
                alert('Error:' + error);
            }
        });
    }

    private deleteIcon(icon) {
        var loading = document.getElementById('gmap-wait');
        loading.innerHTML = "<p><b><font size='3'>Processing, please wait ......</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
        icon.lat = $(`#gmap-input-lat-${icon.id}`).val();
        icon.lng = $(`#gmap-input-lng-${icon.id}`).val();
        icon.location = $(`#gmap-input-location-${icon.id}`).val();
        GLOBAL.GmapService.dataService.delete(GLOBAL.GmapService.ApiGoogleRoadIconUrl + '/' + icon.id).subscribe((res: Response) => {
            if (res["success"]) {
                GLOBAL.GmapService.inforWindows.forEach(inforwin => {
                    inforwin.setMap(null);
                });
                GLOBAL.GmapService.routeMarkers.forEach(m => {
                    m.setMap(null);
                });
                GLOBAL.GmapService.roadIcons.forEach(i => {
                    var id = i.get('id');
                    if (id == icon.id) {
                        i.setMap(null);
                        GLOBAL.GmapService.roadIcons.splice(GLOBAL.GmapService.roadIcons.indexOf(i), 1);
                    }
                });
            } else {
                let error = res['error'];
                alert('Error:' + error);
            }

            loading.innerHTML = '';
        });
    }

    private modifiTable(road) {
        $('#gmapRoadsTable > tbody > tr').each(function (row) {
            var id = $(this).find("input.roadId").val();
            if (road.id == id) {
                this.cells[1].innerHTML = road.direction;
            }
        });
    }

    private deleteRowTable(road) {
        $('#gmapRoadsTable > tbody > tr').each(function (row) {
            var id = $(this).find("input.roadId").val();
            if (road.id == id) {
                this.remove();
            }
        });
    }

    private ShowMessageDialog(type, road, icon) {
        var mother = this;
        var message = document.getElementById('gmap-lblDeleteMessage');
        if (type == this.dialogType.deleteIcon) {
            $('#gmap-modal-deleteTitle').html('Delete Icon');
            message.innerHTML = `Are you sure want to delete this Icon: <strong>"${icon.descriptions}"</strong> ?`;
        } else if (type == this.dialogType.deleteRoad) {
            $('#gmap-modal-deleteTitle').html('Delete Road');
            message.innerHTML = `Are you sure want to delete this Road: <br><strong>"${road.name}"</strong> ?`;
        }
    
        $('#btn-modalDelete').off('click').click(function(){
            if (type == mother.dialogType.deleteIcon) {
                mother.deleteIcon(icon);
            } else if (type == mother.dialogType.deleteRoad) {
                mother.deleteRoad(road);
            }
            $('#gmap-modal-deleteTitle').html('');
            $('#gmap-modal-Delete').modal('hide');
        });

        $('#btn-modalDelete-close').click(function(){
            $('#gmap-modal-deleteTitle').html('');
            $('#gmap-modal-Delete').modal('hide');

        });

        $('#gmap-modal-Delete').modal('show');
    }

    private addToModified(road) {
        var roadModifiedIds = [];
        for (var j = 0; j < this.modifiedRoads.length; j++) {
            roadModifiedIds.push(this.modifiedRoads[j].id);
            if (this.modifiedRoads[j].id == road.id) {
                this.modifiedRoads[j] = road;
                console.log(this.modifiedRoads);
                break;
            }
        }
        var isRoadModExist = false;
        for (var k = 0; k < roadModifiedIds.length; k++) {
            if (roadModifiedIds[k] == road.id) {
                isRoadModExist = true;
                break;
            }
        }
        if (!isRoadModExist) {
            this.modifiedRoads.push(road);
            console.log(this.modifiedRoads);
        }
    }

    private createMaker(text: string, latlng: any, road: Road, isDraggable: boolean) {
        let marker = new google.maps.Marker({
            position: latlng,
            draggable: isDraggable,
            map: this.gmap.controller,
            title: text
        });
        marker.set("road", road);
        if (this.gmap.editPermission) {
            marker.addListener('dragstart', function (event) {
                let lat = event.latLng.lat();
                let lng = event.latLng.lng();
                GLOBAL.oldMarker = new google.maps.LatLng(lat, lng);
                for (var infoWin of GLOBAL.GmapService.inforWindows) {
                    infoWin.setMap(null);
                }
            })
            marker.addListener('dragend', function (event) {
                for (var infoWin of GLOBAL.GmapService.inforWindows) {
                    infoWin.setMap(null);
                }
                let road = marker.get('road');
                let oldLatLng = GLOBAL.oldMarker;
                let oldLat = Math.round(oldLatLng.lat() * 100000) / 100000;
                let oldLng = Math.round(oldLatLng.lng() * 100000) / 100000;
                let newLat = event.latLng.lat();
                let newLng = event.latLng.lng();

                for (var i = 0; i < road.paths.length; i++) {
                    let lat = Math.round(road.paths[i].lat * 100000) / 100000;
                    let lng = Math.round(road.paths[i].lng * 100000) / 100000;
                    if (lat == oldLat && lng == oldLng) {
                        road.paths[i].lat = newLat;
                        road.paths[i].lng = newLng;
                        GLOBAL.oldMarker = null;
                        break;
                    }
                }
                var loading = document.getElementById('gmap-wait');
                loading.innerHTML = "<p><b><font size='4'>map processing, please wait ...</font></b><img src='https://loading.io/spinners/gears/index.dual-gear-loading-icon.svg' height='30' width='30'></p>";
                for (let polyroute of GLOBAL.GmapService.polyroadroutes) {
                    let id = polyroute.get('id');
                    if (id == road.id) {
                        polyroute.setMap(null);
                    }
                }
                GLOBAL.GmapService.drawRoute(road, true, true);
            })

        }
        return marker;
    }
}