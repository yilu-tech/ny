import { Directive, Input, Optional, SkipSelf } from '@angular/core';

@Directive({
    selector: '[nyGroup]',
})
export class NyGroupDirective {
    @Input('nyGroup') name: string | number;

    @Input() autoDestroy: boolean = true;

    constructor(@Optional() @SkipSelf() public parent: NyGroupDirective) {

    }

    public path() {
        let path = typeof this.name === 'string' ? this.name.split('.') : [this.name];
        if (this.parent) {
            path = [...this.parent.path(), ...path];
        }
        return path;
    }
}
