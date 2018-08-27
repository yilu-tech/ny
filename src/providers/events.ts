import { Injectable } from '@angular/core';

type Subscriber = {
    key: string;
    isOnce: boolean,
    hasPublish: boolean,
    unsubscribe: () => void,
    callback: (...data) => void,
};

@Injectable()
export class Events {
    private _events: Map<string, Subscriber[]>;

    constructor() {
        this._events = new Map<string, Subscriber[]>();
    }

    public addKeys(keys?: string | string[]) {
        if (typeof keys === 'string') {
            this._getSubscribers(keys);
        } else {
            keys.forEach((key) => this._getSubscribers(key));
        }
        return this;
    }

    public publish(key: string, ...params) {
        this._events.forEach((subscribers, _key) => {
            if (this._match(_key, key)) {
                subscribers.forEach((subscriber) => {
                    if (!subscriber.hasPublish) {
                        subscriber.hasPublish = true;
                    }
                    if (subscriber.isOnce) {
                        subscribers.splice(subscribers.indexOf(subscriber), 1);
                    }
                    subscriber.callback(...params, this._parseKey(_key));
                });
            }
        });
    }

    public subscribe(key: string, callback: (...data) => void) {
        let subscriber: Subscriber = {
            key, callback, hasPublish: false, isOnce: false,
            unsubscribe: () => this._unsubscribe(subscriber)
        };

        if (key.indexOf('*') < 0) {
            this._getSubscribers(key).push(subscriber);
        } else {
            this._events.forEach((subscribers, _key) => {
                if (this._match(_key, key)) {
                    subscribers.push(subscriber);
                }
            });
        }

        return subscriber;
    }

    public subscribeOnce(key: string, callback: (...data) => void) {
        let subscriber: Subscriber = {
            key, callback, hasPublish: false, isOnce: true,
            unsubscribe: () => this._unsubscribe(subscriber)
        };

        if (key.indexOf('*') < 0) {
            this._getSubscribers(key).push(subscriber);
        } else {
            this._events.forEach((subscribers, _key) => {
                if (this._match(_key, key)) {
                    subscribers.push(subscriber);
                }
            });
        }

        return subscriber;
    }

    private _getSubscribers(key: string): Subscriber[] {
        if (this._events.has(key)) {
            return this._events.get(key);
        }
        let subscribers = [];
        this._events.set(key, subscribers);
        return subscribers;
    }

    private _unsubscribe(subscriber: Subscriber) {
        this._events.forEach((subrs, key) => {
            if (this._match(key, subscriber.key)) {
                subrs.splice(subrs.indexOf(subscriber), 1);
            }
        });
    }

    private _match(k1: string, k2: string) {
        let v1 = this._parseKey(k1);
        let v2 = this._parseKey(k2);
        if (v1.ev !== v2.ev && v2.ev !== '*') return false;
        let i = 0, j = 0;
        for (; i < v1.path.length; i++) {
            if (v1.path[i] === v2.path[j]) j += 1;
            else if (v2.path[j] === '*') {
                if (v2.path[j + 1] === v1.path[i]) j += 2;
                else if (i === v1.path.length - 1 || v2.path[j + 1] === '*') j += 1;
            }
            else return false;
        }
        return j === v2.path.length;
    }

    private _parseKey(key: string) {
        let array = key.split(':');
        return {
            path: array[0].split('.'),
            ev: array[1]
        };
    }
}

export class GlobalEvents extends Events {
}
