import { utils, write } from 'xlsx';

export const value = (item: any, header: any) => {
    let value: any;
    if (Array.isArray(header.value)) {
        value = header.value.reduce((_, k) => _[k], item);
    } else {
        value = item[header.value];
    }
    if ('map' in header) {
        for (let item of header.map) {
            switch (item.operator) {
                case '<':
                    if (value < item.value) return item.label;
                    break;
                case '<=':
                    if (value <= item.value) return item.label;
                    break;
                case '>':
                    if (value > item.value) return item.label;
                    break;
                case '>=':
                    if (value >= item.value) return item.label;
                    break;
                case '!=':
                    if (value != item.value) return item.label;
                    break;
                case '&':
                    if (value & item.value) return item.label;
                    break;
                case '|':
                    if (value | item.value) return item.label;
                    break;
                default:
                    if (value == item.value) return item.label;
                    break;
            }
        }
    }
    if ('decimal' in header) {
        return (parseFloat(value) || 0).toFixed(header.decimal);
    }
    return value;
};

export class Export {

    public type: 'xlsx' | 'csv';

    public filename: string;

    constructor(filename: string = 'download', type: 'xlsx' | 'csv' = 'xlsx') {
        this.type = type;
        this.filename = filename + '.' + type;
    }

    public write(data: Array<any>, headers: Array<any>, title?: string): void {
        let aoa = this._toAoa(data, headers);
        if (title) aoa.unshift([title]);

        let ws = utils.aoa_to_sheet(aoa);

        let wb = utils.book_new();

        utils.book_append_sheet(wb, ws, 'Sheet1');

        const wbout = write(wb, { bookType: this.type, type: 'binary' });

        this._saveAs(new Blob([this._s2ab(wbout)]), this.filename);
    }

    public static downloadUrl(url: string, filename?: string) {
        let link = document.createElement('a');
        link.target = "_blank";
        link.href = url;
        if (filename) {
            link.download = filename;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private _toAoa(data: Array<any>, headers: Array<any>) {

        let aoa = data.map((item) => headers.map((header) => value(item, header)));

        aoa.unshift(headers.map((header) => header.label));

        return aoa;
    }

    private _s2ab(str: string): ArrayBuffer {
        let buff = new ArrayBuffer(str.length);
        let view = new Uint8Array(buff);
        for (let i = 0; i !== str.length; ++i) {
            view[i] = str.charCodeAt(i) & 0xFF;
        }
        return buff;
    }

    private _saveAs(data: Blob, filename: string): void {
        if (window.navigator.msSaveOrOpenBlob) {
            navigator.msSaveBlob(data, filename);
        } else {
            let url = window.URL.createObjectURL(data);
            Export.downloadUrl(url, filename);
            window.URL.revokeObjectURL(url);
        }
    }
}

export class Import {

}
