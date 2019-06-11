import { Directive, Input, ViewChildren, ViewChild, TemplateRef } from '@angular/core';

@Directive({
    selector: '[nyColumn]'
})
export class NyColumn {
    @Input('nyColumn') binding: string;
    @Input() label: string;
    @Input() width: string;
    @Input() minWidth: string;
    @Input() maxWidth: string;

    @Input() after: string;

    constructor(protected templateRef: TemplateRef<any>) {

    }

    public getTemplate() {
        return this.templateRef;
    }

    public assign(header) {
        let attributes = this.toJson();
        for (let name in attributes) {
            if (attributes[name]) {
                header[name] = attributes[name];
            }
        }
    }

    public toJson() {
        return {
            value: this.binding,
            label: this.label,
            width: this.width,
            minWidth: this.minWidth,
            maxWidth: this.maxWidth,
            template: this.getTemplate()
        };
    }
}
