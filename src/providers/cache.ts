import { Injectable } from '@angular/core';

type CacheItem = {
    name: string,
    ttl: number,
    changed: boolean,
    forever: boolean,
    timer?: any,
    data: any,
};

@Injectable()
export class Cache {

    private _cache: Map<string, CacheItem>;

    private _localKeys: string[];
    private _localKeyName: string = '_keys';
    private _localKeyPrefix: string = '__';
    private _localKeysDelimiter: string = '|';

    constructor() {
        this._cache = new Map<string, CacheItem>();
        this.restoreLocalCache();
    }

    public keys() {
        return this._cache.keys();
    }

    public localKeys() {
        return [...this._localKeys];
    }

    public exists(key: string) {
        return this._cache.has(key);
    }

    public isChange(key: string) {
        let temp = this._cache.get(key);

        return temp ? temp.changed : false;
    }

    public get(key: string) {
        let item = this._cache.get(key);

        return item ? item.data : undefined;
    }

    public getAsync(key: string): Promise<any> {
        return new Promise((resolve, reject) => resolve(this.get(key)));
    }

    public set(key: string, value: any, ttl: number = 0, name?: string) {
        let item: CacheItem = {ttl, name, changed: false, forever: ttl < 0, data: value};

        if (this._cache.has(key)) {
            item = {...this._cache.get(key), ...item};
        }

        this._cache.set(key, item);

        if (ttl > 0) {
            if (item.timer) {
                clearTimeout(item.timer);
            }
            item.timer = setTimeout(() => this.remove(key), ttl);
        }

        return item;
    }

    public remove(key: string) {
        if (this._cache.has(key)) {
            let temp = this._cache.get(key);

            if (temp.timer) {
                clearTimeout(temp.timer);
            }
            this._cache.delete(key);
        }
    }

    public change(key: string, isName = false) {
        if (isName) {
            this._cache.forEach(item => {
                if (item.name === key) {
                    item.changed = true;
                }
            });
        } else {
            if (this._cache.has(key)) {
                this._cache.get(key).changed = true;
            }
        }
    }

    public clear(withLocal: boolean = false) {
        this._cache.forEach((item) => {
            if (item.timer) {
                clearTimeout(item.timer);
            }
        });
        this._cache = new Map<string, CacheItem>();
        if (withLocal) {
            this.clearLocal();
        }
    }

    public forever(key: string, value: any) {
        this.set(key, value, -1);

        localStorage.setItem(this._localKeyPrefix + key, JSON.stringify(value));

        if (this._localKeys.indexOf(key) < 0) {
            this._localKeys.push(key);
            localStorage.setItem(this._localKeyName, this._localKeys.join(this._localKeysDelimiter));
        }
    }

    public forget(key: string) {
        let index = this._localKeys.indexOf(key);

        if (index >= 0) {
            this.remove(key);
            this._localKeys.splice(index, 1);

            localStorage.removeItem(this._localKeyPrefix + key);
            if (this._localKeys.length) {
                localStorage.setItem(this._localKeyName, this._localKeys.join(this._localKeysDelimiter));
            } else {
                localStorage.removeItem(this._localKeyName);
            }
        }
    }

    public clearLocal() {
        this._localKeys.forEach((key) => {
            localStorage.removeItem(this._localKeyPrefix + key);
        });
        this._localKeys = [];
        localStorage.removeItem(this._localKeyName);
    }

    public restoreLocalCache() {
        let strKeys = localStorage.getItem(this._localKeyName);

        this._localKeys = strKeys ? strKeys.split(this._localKeysDelimiter) : [];

        this._localKeys.forEach((key) => {
            try {
                let data = localStorage.getItem(this._localKeyPrefix + key);

                this.set(key, JSON.parse(data), -1);

            } catch (e) {

                this.set(key, null, -1);

                localStorage.removeItem(this._localKeyPrefix + key);
            }
        });
    }
}
