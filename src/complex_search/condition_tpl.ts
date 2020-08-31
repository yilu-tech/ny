import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
    selector: '[conditionTpl]'
})
export class ConditionTpl {
    @Input('conditionTpl') name: string;

    @Input() isContainer: boolean;

    @Input() type: 'default' | 'simple' | 'mixed' = 'mixed';

    @Input() selectorType: 'field' | 'condition' | 'mixed' = 'condition';

    constructor(protected templateRef: TemplateRef<any>) {
    }

    public getTemplate() {
        return this.templateRef;
    }
}
