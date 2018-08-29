import {
    Component,
    OnChanges,
    OnInit,
    AfterViewChecked,
    SimpleChanges,
    Input,
    Output,
    Host,
    Optional,
    ViewChildren,
    Renderer2,
    ElementRef,
    EventEmitter,
    QueryList
} from '@angular/core';

import { NyFormDirective } from '../form';
import { NyGroupDirective } from '../group';
import { date, number } from '../utils';

@Component({
    selector: 'ny-table-input',
    templateUrl: './table.html',
    styleUrls: ['./table.scss'],
    host: {'(scroll)': 'onScroll($event)'}
})

export class TableInput implements OnChanges, OnInit, AfterViewChecked {
    @Input() headers: any[] = [];
    @Input() items: any | Array<any>;
    @Input() disabled: boolean;
    @Input() max: number = 0;
    @Input() showFooter: boolean = true;
    @Input() showAddIcon: boolean;
    @Output() onAdd: EventEmitter<any> = new EventEmitter();

    @ViewChildren('TH') public thEls: QueryList<HTMLElement>;

    public data: any[] = [];
    public newItem: any = {$open: {}};
    public activeRow: any[] = [];
    public scroll = {x: 0, y: 0};
    private _timer: any;

    constructor(@Optional() @Host() public form: NyFormDirective,
                @Optional() @Host() public group: NyGroupDirective,
                private elRef: ElementRef,
                private _renderer: Renderer2) {
        if (this.form) {
            this.form.onChange.subscribe((change) => {
                if (change.name === this.name()) {
                    this.data = change.value ? [...change.value] : [];
                    this.data.forEach((_) => _.$open = []);
                } else if (change.name === '$body') this.data = [];
            });
            this.form.onError.subscribe((error) => {
                let keys = Object.keys(error.other);
                let prefix = this.group.path().join('.') + '.';
                this.data.forEach((item, intex) => {
                    let name = prefix + intex;
                    let match = keys.filter((_) => _.indexOf(name) === 0);
                    item.$hasError = !!match.length;
                    item.$errorNotice = [];
                    match.forEach((_) => item.$errorNotice.push(...error.other[_]));
                });
            });
        }
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ('items' in changes && this.items && typeof this.items === 'object') {
            if (Array.isArray(changes.items.currentValue)) {
                this.push(...changes.items.currentValue);
            } else if (changes.items.currentValue) {
                this.push(changes.items.currentValue);
            }
            this.items = null;
        }
        if ('headers' in changes) {
            this.activeRow = [];
            let colIndex = 0;
            this.headers.forEach((header, index) => {
                if (header.onSearch) this.setOptions(this.newItem, header);
                if (colIndex === index) {
                    this.activeRow.push(header);
                    colIndex += 1;
                }
                if (!header.activeColspan || index < colIndex - 1) return;
                if (header.LColspan) {
                    if (header.LColspan >= this.activeRow.length) {
                        this.activeRow = [header];
                    } else {
                        this.activeRow.splice(this.activeRow.length - header.LColspan - 1, header.LColspan);
                    }
                }
                if (header.RColspan) {
                    colIndex += header.RColspan;
                }
            });
        }
    }

    public ngOnInit() {
        if (this.form) {
            this.data = [...(this.form.getValue(this.name()) || [])];
            this.data.forEach((_) => _.$open = []);
        }
    }

    public ngAfterViewChecked() {
        if (this.scroll.x && !this.elRef.nativeElement.scrollLeft) {
            this.elRef.nativeElement.scrollLeft = this.scroll.x;
        }
        if (this.scroll.y && !this.elRef.nativeElement.scrollTop) {
            this.elRef.nativeElement.scrollTop = this.scroll.y;
        }
    }

    public path() {
        return this.group ? this.group.path() : [];
    }

    public name() {
        return this.path().join('.') || null;
    }

    public toString(value, item?: any) {
        return typeof value === 'function' ? value(item) : value;
    }

    public isDisabled(header, item) {
        return this.disabled || this.toString(header.disabled, item) || item.$disabled;
    }

    public focus(header: any, item ?: any) {
        if (!header || !header.onFocus) return;
        if (header.onFocus) header.onFocus(item || this.newItem);
    }

    public search(keywords, header, item) {
        item.$open[header.key] = true;
        if (keywords === null) {
            if (item.$currPage >= item.$lastPage) return;
            item.$currPage += 1;
            this.setOptions(item, header, true);
        } else {
            item.$keywords = keywords;
            item.$currPage = 1;
            this.reduce(500, () => this.setOptions(item, header));
        }
    }

    public setOptions(item, header, next = false) {
        if (!header.onSearch || item.$loading) return;
        let keywords = item.$keywords;
        item.$loading = next ? 2 : 1;
        header.onSearch(keywords, item).then((ret) => {
            if (next) {
                header.options.push(...ret);
            } else {
                if (keywords === item.$keywords) {
                    header.options = ret;
                    // if ('allowAdd' in header && keywords) {
                    //     header.options.unshift({label: keywords, value: header.allowAdd});
                    // }
                } else {
                    this.reduce(500, () => this.setOptions(item, header));
                }
            }

            item.$loading = 0;
        }).catch(() => {
            item.$loading = 0;
        });
    }

    public change(header: any, item?: any, change?: any) {
        if (header.onChange && header.onChange(item || this.newItem, header, !item, change)) {
            setTimeout(() => this.newItem = {$open: {}});
        }
    }

    public add(header?: any, item?: any) {
        let e = {
            item: item || this.newItem,
            add: () => {
                this.push(this.newItem);
                if (!item) this.newItem = {$open: {}};
            }
        };
        if (header) {
            header.onAdd(e);
        } else {
            this.onAdd.emit(e);
        }
    }

    public showCreate(header) {
        if (!header.allowCreate) return false;
        let len = header.options.index;
        if (!len) return true;
        let item = header.options[len - 1];
        return !item.$lastPage || item.$lastPage <= item.$currPage;
    }

    public onCreate(header, item?: any) {
        item = item || this.newItem;
        if (typeof header.allowCreate === 'function') {
            header.allowCreate(item);
        }
    }

    public batchOperate(header, value) {
        this.data.forEach((item) => {
            item[header.key] = value;
        });
    }

    public iconClick(header, item?: any) {
        item = item || this.newItem;
        if (typeof header.iconClick === 'function') {
            header.iconClick(item);
        }
    }

    public blur(header: any, item?: any) {
        if (!header || !header.onBlur) return;
        if (header.onBlur) header.onBlur(item || this.newItem);
    }

    public remove(row) {
        this.data.splice(row, 1);
        if (this.form) setTimeout(() => this.form.setValue(this.path(), [...this.data], {viewChanged: true}));
    }

    public push(...items) {
        if (this.max && (this.max + 1) <= this.data.length) {
            return;
        }
        items.forEach((item) => {
            item.$open = {};
        });
        this.data.push(...items);
        if (this.form) this.form.setValue(this.path(), [...this.data], {viewChanged: true});
    }

    public value(item: any, header: any) {
        let value: any = item[header.key];
        if ('options' in header) {
            for (let item of header.options) {
                if (item.value == value) return item.label;
            }
        }
        if ('replace' in header) {
            value = item[header.replace] || value;
        } else if ('format' in header) {
            value = this._formatter(value, this.toString(header.format, item));
        }
        return value;
    }

    public reduce(time, callback) {
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._timer = setTimeout(callback, time);
    }

    public onScroll() {
        this.scroll.x = this.elRef.nativeElement.scrollLeft;
        this.scroll.y = this.elRef.nativeElement.scrollTop;
        this.thEls.forEach((th) => {
            this._renderer.setStyle(th['el'], 'top', this.scroll.y + 'px');
        });
    }

    private _formatter(value: any, format: string) {
        if (!format) return value;
        if (/^n\d+$/.test(format)) {
            return number(value, format);
        } else if (value instanceof Date) {
            return date(format, value);
        }
        return value;
    }
}
