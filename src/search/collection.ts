import { Export, value } from './utils';

export interface Collection {
    onInit?: Function;
    onLoad?: Function;
    onExportLoad?: Function;
    onChange?: Function;
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

    private _onLoaded: Array<Function> = [];

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

    private _onSetHeader: Array<Function> = [];

    public set onSetHeader(fn: Function) {
        if (fn === null) {
            this._onSetHeader = [];
        } else if (typeof fn === 'function' && this._onLoaded.indexOf(fn) < 0) {
            this._onSetHeader.push(fn);
        }
    }

    public get onSetHeader(): Function {
        return (...argv) => this._onSetHeader.forEach((fn) => fn(...argv));
    }

    private _page: number;
    private _size: number;

    constructor() {
        this.data = [];
        this.checkedItems = [];
    }

    public init() {
        this.initialed = true;

        if (this.onInit) {
            this.onInit();
        }
    }

    public load(): Promise<any> {
        if (!this.initialed) {
            return;
        }

        let option = this.makeOptions();

        this.beforeLoad(option);

        return this.request('post', this.uri, {body: option}).then((ret) => {
            this.setData(ret);
            this.afterLoad(ret);

            if (this.changed) {
                this.load();
            }

        }).catch(() => this.afterLoad());
    }

    private beforeLoad(request) {
        if (this.onLoad) {
            this.onLoad(request);
        }

        this.changed = false;
        this.pending = true;
        this.requestTime = new Date();
    }

    private afterLoad(response?: any) {
        this.responseTime = new Date();
        this.pending = false;

        if (response) {
            if (this.onLoaded) {
                this.onLoaded();
            }
        }
    }

    public change(type?: string) {

        if (!this.initialed) {
            return;
        }

        if (type !== 'page') {
            this._page = 1;
        }

        if (this.onChange) {
            this.onChange(type);
        }

        this.changed = true;
        if (!this.pending) {
            this.load();
        }
    }

    public export(filename?: string, type: 'all' | 'page' | 'checked' = 'all', headers: Array<any> = null, title?: string, filetype: 'xlsx' | 'csv' = 'xlsx') {
        let _export = new Export(filename, filetype);

        headers = headers || this.headers;

        if (type === 'all') {
            let body = this.makeOptions();
            body.extras = {type};
            if (this.onExportLoad) {
                this.onExportLoad(body);
            }
            delete body.size;
            this.request('post', this.uri, {body: body}).then((ret) => {
                if (!Array.isArray(ret)) {
                    if (ret.footer) {
                        ret.data.push(...ret.footer);
                    }
                    ret = ret.data;
                }
                _export.write(ret, headers);
            });
        }
        if (type === 'page') {
            _export.write(this.data, headers);
        }

        if (type === 'checked') {
            _export.write(this.checkedItems, headers);
        }
    }

    public serverExport(filename?: string, type: 'all' | 'page' | 'checked' = 'all', extras: any = {}, headers: Array<any> = null, filetype: 'xls' | 'csv' = 'xls'): Promise<string> {

        headers = headers || this.headers;

        let body = this.makeOptions();
        body.action = 'export';
        body.extras = {filetype, filename, type, ...extras};
        body.fields = {};
        headers.forEach((item) => {
            body.fields[item.field || item.value] = item.label;
        });

        if (type !== 'page') {
            delete body.size;
        }

        if (this.onExportLoad) {
            this.onExportLoad(body);
        }

        return this.request('post', this.uri, {body}).then((str) => 'export?' + str);
    }

    public setHeader(headers) {
        this.headers = headers;
        this.onSetHeader(headers);
    }

    public getHeader(field: string) {
        for (let header of this.headers) {
            if (Array.isArray(header.value)) {

                if (header.value[header.value.length - 1] === field) {
                    return header;
                }

                continue;
            }

            if (header.value === field) {
                return header;
            }
        }
    }

    public removeHeader(header) {
        if (!Array.isArray(header)) {
            header = [header];
        }
        header.forEach((_) => {
            if (typeof _ === 'string') {
                _ = this.getHeader(_);
            }
            let index = this.headers.indexOf(_);
            if (index >= 0) {
                this.headers.splice(index, 1);
            }
        });
    }

    public getValue(item: any, header) {
        if (typeof header === 'string') {
            header = this.getHeader(header);
        }

        if (!header) {
            return null;
        }

        return value(item, header);
    }

    public getOption(item: any, header) {
        if (typeof header === 'string') {
            header = this.getHeader(header);
        }

        if (!header || !header.map) {
            return null;
        }

        for (let option of header.map) {
            if (option.value == item[header.value]) {
                return option;
            }
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
            if (data.footer) {
                this.setFooter(data.footer);
            }
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

    public makeOptions(headers?: Array<any>) {
        headers = headers || this.headers;
        let options: any = {
            action: 'query',
            params: [...this.params],
            fields: headers.filter((_) => !_.custom).map((header) => header.field || header.value),
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
