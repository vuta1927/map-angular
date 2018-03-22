import { Component, AfterViewInit } from '@angular/core';

declare let mLayout: any;
@Component({
    selector: "app-aside-nav",
    templateUrl: "./aside-nav.component.html"
})
export class AsideNavComponent implements AfterViewInit {

    ngAfterViewInit() {
        mLayout.initAside();
    }
}