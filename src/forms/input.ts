import {
    Directive,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    OnDestroy,
    Optional,
    Host, Self, Inject,
    SimpleChanges,
    Renderer2,
    ElementRef, SkipSelf,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DefaultValueAccessor } from './default_value_accessor';
import { NyFormDirective } from './form';
import { NyGroupDirective } from './group';
import { date, number } from '../utils';

function selectValueAccessor(valueAccessors: ControlValueAccessor[]): ControlValueAccessor | null {
    if (!valueAccessors) return null;

    if (!Array.isArray(valueAccessors))
        throw new Error('Value accessor was not provided as an array for form control with');

    let defaultAccessor: ControlValueAccessor | undefined = undefined;
    let customAccessor: ControlValueAccessor | undefined = undefined;

    valueAccessors.forEach((v: ControlValueAccessor) => {
        if (v.constructor === DefaultValueAccessor) {
            defaultAccessor = v;

        } else {
            if (customAccessor)
                throw new Error('More than one custom value accessor matches form control with');
            customAccessor = v;
        }
    });

    if (customAccessor) return customAccessor;
    if (defaultAccessor) return defaultAccessor;

    throw new Error('No valid value accessor for form control with');
}

const resolvePromise = Promise.resolve(null);

@Directive({
    selector: '[nyName]',
})
export class NyInputDirective implements OnChanges, OnDestroy {
    @Input('nyName') public name: string | string;
    @Input() public format: string;
    @Input() public replace: string;
    @Input() public disabled: boolean;
    @Input() public errorStyle: string;
    @Input() public autoDestroy: boolean = true;
    @Output() public onError: EventEmitter<any> = new EventEmitter<any>();
    @Output('onChange') public change: EventEmitter<any> = new EventEmitter<any>();

    public value: any;
    public error: any;
    public firstChange: boolean = true;
    public initialValue: any;
    public inputEl: HTMLInputElement;
    public valueAccessor: ControlValueAccessor = null;

    private _registered: boolean;
    private readonly _parent: NyFormDirective;
    private readonly _group: NyGroupDirective;
    private _errorEl: HTMLElement;
    private _timer: number;

    constructor(@Optional() @Host() parent: NyFormDirective,
                @Optional() @Host() group: NyGroupDirective,
                @Optional() @Self() @Inject(NG_VALUE_ACCESSOR) valueAccessors: ControlValueAccessor[],
                public _el: ElementRef, public _renderer: Renderer2) {

        this._parent = parent;
        this._group = group;
        this.valueAccessor = selectValueAccessor(valueAccessors);
    }

    public ngOnChanges(changes: SimpleChanges) {
        if (!this._registered) this._setUpControl();

        if ('name' in changes) {
            if (this._parent && changes.name.firstChange) {
                this._parent.registerControl(this);
            }
        }

        if ('disabled' in changes) {
            this._setDisabled(changes.disabled.currentValue);
        }

        if ('replace' in changes) this._writeValue();
    }

    public ngOnDestroy() {
        if (this._registered) this._parent.destroyControl(this);
        clearTimeout(this._timer);
    }

    public path() {
        let path = typeof this.name === 'string' ? this.name.split('.') : [this.name];
        if (this._group) {
            path = [...this._group.path(), ...path];
        }
        return path;
    }

    public modelToView(value) {
        if (this.value === value) return;

        this._setValue(this._formatter(value));

        this._writeValue();

        this.onChange(this.value !== value);
    }

    public viewToModel(value) {
        if (this.value === value) return;

        this._setValue(value);

        this.onChange();
    }

    public onChange(viewChanged = true) {
        if (this._parent && viewChanged) {
            this._parent.change(this.path().join("."), this.value);
        }
        if (this.error) {
            this._reduce(500, () => this._parent.validate());
        }
    }

    public focus() {
        if (this.valueAccessor instanceof DefaultValueAccessor) {
            this.inputEl.focus();
        } else if ('nzOpen' in this.valueAccessor) {
            this.valueAccessor['nzOpen'] = true;
            this.inputEl.focus();
        } else if (this.valueAccessor['focus']) {
            this.valueAccessor['focus']();
        }
    }

    public blur() {
        if (this.valueAccessor instanceof DefaultValueAccessor) {
            this._el.nativeElement.blur();
        } else if ('nzOpen' in this.valueAccessor) {
            this.valueAccessor['nzOpen'] = false;
        } else if (this.valueAccessor['blur']) {
            this.valueAccessor['blur']();
        }
    }

    public canDestroy() {
        if (!this.autoDestroy) return false;
        let group = this._group;
        while (group) {
            if (!group.autoDestroy) return false;
            group = group.parent;
        }
        return true;
    }

    public isChanged() {
        return this.initialValue !== this.value;
    }

    public setError(error) {
        this.clearError();
        this.error = error;
        if (error) {
            this._addMessage();
            this.onError.emit(error);
        }
    }

    public clearError() {
        if (this.error) {
            this.error = null;
            this._removeMessage();
            clearTimeout(this._timer);
        }
    }

    private _setUpControl(): void {
        if (!this.valueAccessor) throw new Error('No value accessor for form control with');

        this.valueAccessor.writeValue(this.value);

        let onChange = this.valueAccessor['_onChange'] || this.valueAccessor['onChange'];
        this.valueAccessor.registerOnChange((_) => {
            if (onChange) onChange(_);
            this.viewToModel(this._formatter(_));
            if (!(this.valueAccessor instanceof DefaultValueAccessor)) {
                this._writeValue();
            }
        });

        let onTouched = this.valueAccessor['_onTouched'] || this.valueAccessor['onTouched'];
        this.valueAccessor.registerOnTouched(() => {
            if (onTouched) onTouched();
            this._writeValue();
        });
        this._registered = true;
    }

    private _setValue(value) {
        let simpleChange = {
            firstChange: this.firstChange,
            initialValue: this.initialValue,
            currentValue: value,
            previousValue: this.value,
        };
        if (this.firstChange) {
            this.firstChange = false;
            simpleChange.initialValue = this.initialValue = value;
        }
        this._parent.setValue(this.path(),  this.value = value);
       
        this.change.emit(simpleChange);
    }

    private _writeValue() {
        if (this.valueAccessor) {
            let value = this.value;
            if (this._parent && this.replace) {
                value = this._parent.getValue([...this.path().slice(0, -1), this.replace]) || value;
            }
            resolvePromise.then(() => this.valueAccessor.writeValue(value));
        }
    }

    private _reduce(time, callback) {
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._timer = setTimeout(callback, time);
    }

    private _formatter(value: any) {
        if (!this.format) return value;
        if (/^n\d+$/.test(this.format) && value !== '' && value !== null) {
            return number(value, this.format);
        } else if (value instanceof Date) {
            return date(this.format, value);
        }
        return value;
    }

    private _setDisabled(isDisabled: boolean) {
        if (this.valueAccessor) {
            this.valueAccessor.setDisabledState(isDisabled);
        }
    }

    private _addMessage() {
        let parentNode = this._el.nativeElement.parentNode;
        if (!this._errorEl) {
            this._renderer.addClass(parentNode, 'has-error');
            this._errorEl = document.createElement('div');
            this._renderer.addClass(this._errorEl, 'error-message');
            const next = this._el.nativeElement.nextSibling;

            if (next) {
                parentNode.insertBefore(this._errorEl, next);
            } else {
                parentNode.appendChild(this._errorEl);
            }
            if (this.errorStyle === 'float') {
                this._addFloatStyle(this._errorEl);
            }
        }
        this._errorEl.innerHTML = this.error.notices.map((msg) => '<span style="display: block">' + msg + '</span>').join('');
    }

    private _removeMessage() {
        if (!this._errorEl) return;
        let parentElement = this._el.nativeElement.parentElement;

        this._renderer.removeClass(parentElement, 'has-error');
        this._renderer.removeChild(parentElement, this._errorEl);
        if (this.errorStyle === 'float') {
            parentElement.onmouseover = parentElement.onmouseout = null;
        }
        this._errorEl = null;
    }

    private _addFloatStyle(errorEl: HTMLElement) {
        this._renderer.setStyle(errorEl, 'display', 'none');
        this._renderer.setStyle(errorEl, 'position', 'fixed');
        this._renderer.setStyle(errorEl, 'z-index', '2048');
        errorEl.parentElement.onmouseover = () => {
            const rect = this._el.nativeElement.getBoundingClientRect();
            this._renderer.setStyle(errorEl, 'left', rect.left + 'px');
            this._renderer.setStyle(errorEl, 'top', rect.top + rect.height + 'px');
            this._renderer.setStyle(errorEl, 'display', 'block');
        };
        errorEl.parentElement.onmouseout = () => {
            this._renderer.setStyle(errorEl, 'display', 'none');
        };
    }
}

@Directive({
    selector: '[nyDeepName]'
})
export class NyDeepInputDirective extends NyInputDirective {
    @Input('nyDeepName') public name;

    constructor(@Optional() @SkipSelf() parent: NyFormDirective,
                @Optional() @SkipSelf() group: NyGroupDirective,
                @Optional() @Self() @Inject(NG_VALUE_ACCESSOR) valueAccessors: ControlValueAccessor[],
                public _el: ElementRef, public _renderer: Renderer2) {
        super(parent, group, valueAccessors, _el, _renderer);
    }
}
