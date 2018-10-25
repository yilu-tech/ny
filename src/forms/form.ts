import {
    Directive,
    Input,
    SimpleChanges,
    Output,
    EventEmitter,
    ViewContainerRef,
    OnChanges,
    DoCheck
} from '@angular/core';
import { NyInputDirective } from './input';

@Directive({
    selector: '[nyForm]'
})
export class NyFormDirective implements OnChanges, DoCheck {
    @Input('nyForm') name: string;
    @Output('onInit') init: EventEmitter<any> = new EventEmitter<any>();
    @Output() onChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() onError: EventEmitter<any> = new EventEmitter<any>();

    private readonly _form: any;
    private readonly _controls: Array<NyInputDirective> = [];
    private readonly _component: any;

    private _timer;

    constructor(private viewRef: ViewContainerRef) {
        this._component = viewRef.injector['view'].component;
        this._form = {
            submit: () => this.submit(),
            getBody: () => this.body(),
            getValue: (name) => this.getValue(name),
            setValue: (name, value, emit?: boolean) => {
                if (Array.isArray(value)) {
                    value = Object.assign([], value);
                } else if (typeof value === 'object' && value) {
                    value = Object.assign({}, value);
                }
                this.setValue(name, value, {viewChanged: emit});
            },
            change: (name, value) => this.change(name, value),
            hasChange: () => this.hasChange(),
            clear: () => this.change('$body', this._form.body = {}),
            clearError: () => this.clearError(),
            setError: (errors: any) => this.setError(errors)
        };
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ('name' in changes && changes.name.firstChange) {
            this._registerForm(changes.name.currentValue);
        }
    }

    public ngDoCheck() {
        this._controls.forEach((control) => {
            control.modelToView(this.getValue(control.path()));
        });
    }

    public body() {
        const options: any = {body: {}};

        this._controls.forEach((control) => this.setValue(control.path(), control.value, options));

        if (Array.isArray(this._form.names)) {
            this._form.names.forEach((_) => {
                if (typeof _ === 'string') {
                    this.setValue(_, null, {...options, from: _});
                } else {
                    this.setValue(_.name, _.value, {...options, from: _.from});
                }
            });
        }

        if (this._form.map) this._form.map(options.body);
        return options.body;
    }

    public toArray(path: any): Array<any> {
        if (typeof path === 'string') path = path.split('.');
        if (!Array.isArray(path)) path = [];
        return path;
    }

    public setValue(path: any, value: any, options: any = {}) {
        path = this.toArray(path);

        let prev = {obj: options.body ? options : this._form, _: this._form, name: 'body'};

        for (let i = 0; i < path.length; i++) {
            if (path[i] === '*') {
                if (!Array.isArray(prev._[prev.name])) return;
                prev._[prev.name].forEach((_, k) => {
                    path[i] = k;
                    this.setValue(path, value, options);
                });
            }
            let curr = prev.obj[prev.name];
            if (/^\d+$/.test(path[i])) {
                if (curr === undefined || !Array.isArray(curr)) curr = prev.obj[prev.name] = [];
            } else {
                if (curr === undefined || Array.isArray(curr)) curr = prev.obj[prev.name] = {};
            }
            prev = {obj: curr, name: path[i], _: prev._[prev.name]};
        }
        if (options.from) {
            value = this.getValue(this.toArray(options.from).map((_, i) => _ === '*' ? path[i] : _));
        }
        prev.obj[prev.name] = value;

        if (options.viewChanged) this.change(path.join('.'), value);
    }

    public getValue(path: string | Array<string | number>) {
        path = this.toArray(path);

        if (!this._form.body) return null;

        return path.reduce((v, name) => {
            return v ? v[name] : null;
        }, this._form.body);
    }

    public change(name: string, value?: any) {
        if (value === undefined) value = this.getValue(name);
        this.onChange.emit({name, value, body: this._form.body});
    }

    public hasChange() {
        for (let control of this._controls) {
            if (control.isChanged()) return true;
        }
        return false;
    }

    public registerControl(control: NyInputDirective) {
        this._controls.push(control);
    }

    public destroyControl(control: NyInputDirective) {
        this._controls.splice(this._controls.indexOf(control), 1);
        control.clearError();
        if (control.canDestroy()) {
            let path = control.path();
            let name = path.pop();
            let curr = this.getValue(path);
            if (curr) delete curr[name];
        }
    }

    public submit(): Promise<any> {
        const body = this.body();
        if (this._form.onSubmit) this._form.onSubmit(body);

        let method = this._form.method || 'POST';
        return this._form.request(method, this._form.action, {body}).catch((errorResponse) => {
            if (errorResponse.status === 422) {
                this._handleValidateError(errorResponse.error.data);
            }
            return Promise.reject(errorResponse);
        });
    }

    public validate() {
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._timer = setTimeout(() => {
            const body = this.body();
            if (this._form.onSubmit) this._form.onSubmit(body);
            let method = this._form.method || 'POST';
            let options = {headers: {'VALIDATOR-REQUEST': 'true'}, body};
            this._form.request(method, this._form.action, options).catch((errorResponse) => {
                if (errorResponse.status === 422) {
                    this._handleValidateError(errorResponse.error.data);
                }
            });
        }, 200);
    }

    public clearError() {
        this._controls.forEach((control) => control.clearError());
    }

    private _registerForm(name: string) {
        this._form.body = this._component[name] || {};

        this._component[name] = this._form;

        this.init.emit(this._form);
    }

    private _handleValidateError(errors: any) {
        let error = {input: {}, other: errors, keys: Object.keys(errors)};
        this._controls.forEach((control) => {
            let name = control.path().join('.');
            if (Array.isArray(errors[name])) {
                control.setError({prevValue: control.value, notices: errors[name]});
                error.input[name] = errors[name];
                delete errors[name];
            } else if (control.error) {
                control.setError(null);
            }
        });
        this.onError.emit(error);
    }

    public setError(errors: any) {
        this._handleValidateError(errors);
    }
}
