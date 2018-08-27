import { Component, OnChanges, AfterViewChecked, Input, ViewChildren, ViewChild, QueryList, ElementRef, Renderer2 } from '@angular/core';

@Component({
    selector: 'ny-table',
    styleUrls: ['./table.scss'],
    templateUrl: './table.html',
    host: {class: ' ant-spin-nested-loading'}
})
export class NyTable implements OnChanges, AfterViewChecked {
    @Input() collection: any = {data: []};
    @Input() showIndex: boolean;

    @ViewChild('Scroll') public scrollEl: ElementRef;
    @ViewChildren('TH') public thEls: QueryList<HTMLElement>;
    @ViewChildren('LH') public lhEls: QueryList<HTMLElement>;

    public scroll = {x: 0, y: 0};
    public allChecked = false;
    public indeterminate = false;

    constructor(private _renderer: Renderer2) {

    }

    public ngOnChanges(changes) {
        this.collection.onLoaded = () => this.refreshStatus();
    }

    public ngAfterViewChecked() {
        this.recoveryScroll();
    }

    public index(row: number) {
        return (this.collection.page - 1) * this.collection.size + row + 1;
    }

    public onScroll() {
        if (this.scroll.x !== this.scrollEl.nativeElement.scrollLeft) {
            this.scroll.x = this.scrollEl.nativeElement.scrollLeft;
            this.lhEls.forEach((th) => {
                this._renderer.setStyle(th['el'], 'left', this.scroll.x + 'px');
            });
        }
        if (this.scroll.y !== this.scrollEl.nativeElement.scrollTop) {
            this.scroll.y = this.scrollEl.nativeElement.scrollTop;
            this.thEls.forEach((th) => {
                this._renderer.setStyle(th['el'], 'top', this.scroll.y + 'px');
            });
        }
    }

    public recoveryScroll() {
        if (this.scroll.x && !this.scrollEl.nativeElement.scrollLeft) {
            this.scrollEl.nativeElement.scrollLeft = this.scroll.x;
        }
        if (this.scroll.y && !this.scrollEl.nativeElement.scrollTop) {
            this.scrollEl.nativeElement.scrollTop = this.scroll.y;
        }
    }

    public toString(value, item?: any) {
        return typeof value === 'function' ? value(item) : value;
    }

    public color(item, header) {
        let color = this.toString(header.color, item);
        if (!color) {
            let option = this.collection.getOption(item, header);
            if (option) color = option.color;
        }
        return color;
    }

    public refreshStatus(item?: any): void {
        if (item && item.$checked) {
            this.collection.currentItem = item;
        } else {
            this.collection.currentItem = null;
        }
        this.collection.checkedItems = this.collection.data.filter(value => value.$checked);
        const checkedNumber = this.collection.checkedItems.length;

        this.allChecked = checkedNumber === this.collection.data.length;

        this.indeterminate = (!this.allChecked) && checkedNumber > 0;
    }

    public click(item) {
        if (this.collection.currentItem === item) {
            this.collection.currentItem = null;
        } else {
            this.collection.currentItem = item;
        }
        if (this.collection.onClick) this.collection.onClick(item);
    }

    public dblClick(item) {
        if (this.collection.onDblClick) {
            this.collection.onDblClick(item);
        }
    }

    public checkAll(value: boolean): void {
        this.collection.data.forEach(data => data.$checked = value);
        this.refreshStatus();
    }

    public sort(key, status: string) {
        if (status) {
            this.collection.orderBy = key + ' ' + status.slice(0, -3);
        } else {
            this.collection.orderBy = undefined;
        }
        this.collection.load();
    }

    public LHIWidth() {
        return this.index(this.collection.data.length - 1).toString().length * 8 + 16;
    }
}
