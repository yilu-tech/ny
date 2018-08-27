import { Directive, OnChanges, OnDestroy, Input, SimpleChanges, ElementRef, Renderer2 } from '@angular/core';

@Directive({
    selector: '[ny-run-number]',
})

export class NyRunNumber implements OnChanges, OnDestroy {
    @Input() public value: string | number;
    @Input() public radix: number = 2;
    @Input() public time: number = 360;

    private _timer: any;
    private _status: string;

    constructor(private renderer: Renderer2, private elRef: ElementRef) {
        this._status = 'stop';
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ('value' in changes) {
            this.run(changes.value.previousValue || 0);
        }
    }

    public ngOnDestroy() {
        this.stop();
    }

    public run(prevValue) {
        let currValue = this._format(prevValue);
        let endValue = this._format(this.value);

        let step = (endValue - currValue) / Math.ceil(this.time / 30);
        if (step === 0) {
            if (this._status === 'stop') {
                this.elRef.nativeElement.innerText = currValue.toFixed(this.radix);
            }
            return;
        }

        this.stop();
        let currTime = 0;

        this._status = 'running';
        this._timer = setInterval(() => {
            currTime += 30;
            if (currTime >= this.time) {
                currValue = endValue;
            } else {
                currValue += step;
            }
            this.setValue(currValue.toFixed(this.radix));
            if (currTime >= this.time) this.stop();
        }, 30);
    }

    public setValue(value) {
        this.value = value;
        this.elRef.nativeElement.innerText = value;
    }

    private _format(value): number {
        return (typeof value === 'number' ? value : parseFloat(value)) || 0;
    }

    private stop() {
        if (this._status === 'running') {
            clearInterval(this._timer);
            this._status = 'stop';
        }
    }
}

