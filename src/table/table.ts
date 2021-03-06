import {
    Component,
    OnChanges,
    AfterViewChecked,
    Input,
    ViewChildren,
    ViewChild,
    QueryList,
    ElementRef,
    Renderer2,
    HostListener,
    ContentChildren
} from '@angular/core';
import { NyColumn } from './column';

@Component({
    selector: 'ny-table',
    styleUrls: ['./table.scss'],
    templateUrl: './table.html'
})
export class NyTable implements OnChanges, AfterViewChecked {
    @Input() collection: any = {data: [], footers: []};
    @Input() showIndex: boolean;
    @Input() showHeaders: string[];

    @ViewChild('Scroll') public scrollEl: ElementRef;
    @ViewChild('THEAD') public theadEl: ElementRef;
    @ViewChild('TFOOT') public tfootEl: ElementRef;
    @ViewChildren('TH', {read: ElementRef}) public thEls: QueryList<ElementRef>;
    @ViewChildren('LH', {read: ElementRef}) public lhEls: QueryList<ElementRef>;
    @ViewChildren('THR') public thrEls: QueryList<ElementRef>;

    @ContentChildren(NyColumn) public columnTemplates: QueryList<NyColumn>;

    public headers: any[] = [];
    public scroll = {x: 0, y: 0};
    public allChecked = false;
    public indeterminate = false;

    constructor(private _renderer: Renderer2) {

    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.ngAfterViewChecked();
    }

    public ngOnChanges(changes) {
        if ('collection' in changes) {
            this.collection.onLoaded = () => this.refreshStatus();
            this.collection.refreshStatus = () => {
                this.refreshStatus();
                setTimeout(() => this.ngAfterViewChecked());
            };
            this.collection.onSetHeader = () => this.bindHeaders();
        }
    }

    public ngAfterViewChecked() {
        if (!this.thEls) {
            return;
        }
        this.thEls.forEach((item: ElementRef, index) => {
            this.thrEls.forEach((tr) => {
                tr.nativeElement.children[index].style.width = item.nativeElement.clientWidth + 'px';
            });
        });
    }

    public index(row: number) {
        return (this.collection.page - 1) * this.collection.size + row + 1;
    }

    public onScroll() {
        this.scroll.x = this.scrollEl.nativeElement.scrollLeft;
        this.scroll.y = this.scrollEl.nativeElement.scrollTop;
        this.theadEl.nativeElement.scrollLeft = this.scroll.x;
        if (this.tfootEl) {
            this.tfootEl.nativeElement.scrollLeft = this.scroll.x;
        }
        this.lhEls.forEach((th: ElementRef) => {
            this._renderer.setStyle(th.nativeElement, 'left', this.scroll.x + 'px');
        });
    }

    public toString(value, item?: any) {
        return typeof value === 'function' ? value(item) : value;
    }

    public color(item, header) {
        let color = this.toString(header.color, item);
        if (!color) {
            let option = this.collection.getOption(item, header);
            if (option) {
                color = option.color;
            }
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
        if (this.collection.onClick) {
            this.collection.onClick(item);
        }
    }

    public dblClick(item) {
        if (this.collection.onDblClick) {
            this.collection.onDblClick(item);
        }
    }

    public check(item?: any) {
        if (!item) {
            this.collection.data.forEach(data => data.$checked = this.allChecked);
        }
        this.refreshStatus(item);

        if (this.collection.onChecked) {
            this.collection.onChecked(item, this.collection.checkedItems);
        }
    }

    public sort(header) {
        if (this.collection.sortColumn && this.collection.sortColumn !== header) {
            this.collection.sortColumn.sortDirection = null;
        }
        if (header.sortDirection) {
            this.collection.sortColumn = header;
            this.collection.orderBy = header.value + ' ' + header.sortDirection.slice(0, -3);
        } else {
            this.collection.sortColumn = null;
            this.collection.orderBy = undefined;
        }
        this.collection.load();
    }

    public LHIWidth() {
        return this.index(this.collection.data.length - 1).toString().length * 8 + 16;
    }

    private bindHeaders() {
        this.headers = this.collection.headers.filter((item) => {
            return !this.showHeaders || this.showHeaders.indexOf(item.value) >= 0;
        });

        this.columnTemplates.forEach(item => {
            let header = this.collection.headers.find(_ => _.value == item.binding);
            if (header) {
                return item.assign(header);
            }
            if (item.after === '$') {
                return this.headers.unshift(item.toJson());
            }
            let index = this.headers.findIndex((_) => _.value == item.after);
            if (index < 0) {
                this.headers.push(item.toJson());
            } else {
                this.headers.splice(index, 0, item.toJson());
            }
        });
    }
}
