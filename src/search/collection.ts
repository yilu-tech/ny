import { Export, value } from './utils';

export interface Collection {
    onInit?: Function;
    onLoad?: Function;
    onExportLoad?: Function;
    onChange?: Function;
    onSetHeader?: Function;
    addWhere?: Function;
    resetHeader?: Function;
}

export type Request = (method: string, uri: string, options: any) => Promise<any>

export class Collection {

    public uri: string;

    public data: Array<any>;

    public pending: boolean;

    public changed: boolean;

    public disabled: boolean;

    public initialed: boolean;

    public checkedItems: Array<any>;

    public showCheckbox: boolean;

    public request: Request;

    public headers: Array<any> = [];

    public footers: Array<any> = [];

    public params: Array<Array<any>>;

    public orderBy: string;

    public groupBy: string;

    public total: number;

    public pageTotal: number;

    public requestTime: Date;

    public responseTime: Date;

    public set onLoaded(fn: Function) {
        if (fn === null) {
            this._onLoaded = [];
        } else if (typeof fn === 'function' && this._onLoaded.indexOf(fn) < 0) {
            this._onLoaded.push(fn);
        }
    }

    public get onLoaded(): Function {
        return (...argv) => this._onLoaded.forEach((fn) => fn(...argv));
    }

    private _page: number;
    private _size: number;
    private _onLoaded: Array<Function> = [];

    constructor() {
        this.data = [];
        this.checkedItems = [];
    }

    public init() {
        this.initialed = true;

        if (this.onInit) this.onInit();
    }

    public load(): Promise<any> {
        if (!this.initialed) return;

        let option = this.makeOptions();

        this.beforeLoad(option);

        return this.request('post', this.uri, {body: option}).then((ret) => {
            this.setData(ret);
            this.afterLoad(ret);

            if (this.changed) this.load();

        }).catch(() => this.afterLoad());
    }

    private beforeLoad(request) {
        if (this.onLoad) this.onLoad(request);

        this.changed = false;
        this.pending = true;
        this.requestTime = new Date();
    }

    private afterLoad(response?: any) {
        this.responseTime = new Date();
        this.pending = false;

        if (response) {
            if (this.onLoaded) this.onLoaded();
        }
    }

    public change(type?: string) {

        if (!this.initialed) return;

        if (type !== 'page') {
            this._page = 1;
        }

        if (this.onChange) this.onChange(type);

        this.changed = true;
        if (!this.pending) this.load();
    }

    public export(filename?: string, type: 'all' | 'page' | 'checked' = 'all', isLocal = true, title?: string, filetype: 'xlsx' | 'csv' = 'xlsx') {
        let _export = new Export(filename, filetype);

        if (isLocal) {
            if (type === 'all') {
                let options = this.makeOptions();
                if (this.onExportLoad) this.onExportLoad(options);
                delete options.size;
                this.request('post', this.uri, {body: options}).then((ret) => {
                    _export.local(ret, this.headers);
                });
            }
            if (type === 'page') _export.local(this.data, this.headers);
            if (type === 'checked') _export.local(this.checkedItems, this.headers);
        } else {
            _export.server();
        }
    }

    public setHeader(headers) {
        this.headers = headers;
        if (this.onSetHeader) {
            this.onSetHeader();
        }
    }

    public getHeader(field: string) {
        for (let header of this.headers) {
            if (header.value === field) {
                return header;
            }
        }
    }

    public removeHeader(header) {
        if (!Array.isArray(header)) header = [header];
        header.forEach((_) => {
            if (typeof _ === 'string') {
                _ = this.getHeader(_);
            }
            let index = this.headers.indexOf(_);
            if (index >= 0) this.headers.splice(index, 1);
        });
    }

    public getValue(item: any, header) {
        if (typeof header === 'string') header = this.getHeader(header);

        if (!header) return null;

        return value(item, header);
    }

    public getOption(item: any, header) {
        if (typeof header === 'string') header = this.getHeader(header);

        if (!header || !header.map) return null;

        for (let option of header.map) {
            if (option.value == item[header.value]) return option;
        }
        return null;
    }

    public setData(data: any) {
        if (Array.isArray(data)) {
            this.data = data;
            this.size = 0;
            this.total = this.data.length;
        } else {
            this.data = data.data;
            this._page = data.current_page || 1;
            this.total = data.total || this.data.length;
            this.pageTotal = data.last_page || 1;
            if (data.footer) this.setFooter(data.footer);
        }
    }

    public setFooter(footers: Array<any>) {
        this.footers = footers.map((item) => {
            let row = [];
            for (let attr in item) {
                let index = this.headers.indexOf(this.getHeader(attr));
                if (index >= 0) {
                    row[index] = item[attr];
                }
            }
            return row;
        });
    }

    public makeOptions() {
        let options: any = {
            action: 'query',
            params: [...this.params],
            fields: this.headers.filter((_) => !_.custom).map((header) => header.field),
            orderBy: this.orderBy,
            groupBy: this.groupBy
        };
        if (this._size) {
            options.size = this._size;
            options.page = this._page;
        }
        return options;
    }

    get page() {
        return this._page;
    }

    set page(page: number) {
        if (this._page !== page) {
            this._page = page;
            this.change('page');
        }
    }

    get size() {
        return this._size;
    }

    set size(size: number) {
        if (this._size !== size) {
            this._size = size;
            this.change('size');
        }
    }
}
