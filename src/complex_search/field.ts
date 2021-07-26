import {
    SelectCondition,
    Condition,
    DateCondition,
    TimeCondition,
    TreeSelectCondition,
    MultipleSelectCondition,
    DateRangeCondition,
    TimeRangeCondition,
    NumericCondition,
    NumericRangCondition
} from './condition';

const FIELD_PROPERTIES = ['name', 'label', 'itype', 'showTime', 'ctype', 'isFullLabel', 'custom', 'min', 'max', 'format', 'options', 'required'];

export declare interface FieldAble {
    name: string;

    label: string;
    
    path: () => string;

    toString: () => string;
}

export class Field implements FieldAble {
    public parent: FieldAble;

    public name: string;
    public label: string;
    public showTime: boolean;

    public min: any;
    public max: any;
    public format: any;
    public options: { label: string, value: any }[];

    public itype: string;
    public ctype: string;

    public custom: boolean;
    public isFullLabel: boolean;

    public checked: boolean;
    public required: boolean;
    public disabled: boolean;

    public children: Field[];

    public conditionOptions;

    constructor(option: any = {}, parent: FieldAble = null) {
        for (let key of FIELD_PROPERTIES) {
            if (key in option) {
                this[key] = option[key];
            }
        }
        this.conditionOptions = option;
        this.parent = parent;
    }

    public get(name: string) {
        return this.children.find((field) => field.name == name);
    }

    public find(path: string) {
        let parts = path.split('.');
        let field: any = this;
        for (let name of parts) {
            field = field.get(name);
            if (!field) {
                return null;
            }
        }
        return field;
    }

    public newCondition(value?: any, operator?: string) {
        if (operator == null) {
            operator = this.conditionOptions.operator || '=';
        }
        switch (this.ctype || this.itype) {
            case 'numeric':
                return this.createCondition(NumericCondition, value, operator);
            case 'numeric-in':
                return this.createCondition(NumericRangCondition, value, operator);
            case 'select':
            case 'radio':
                return this.createCondition(SelectCondition, value, operator);
            case 'multiple':
                return this.createCondition(MultipleSelectCondition, value, operator);
            case 'tree-select':
                return this.createCondition(TreeSelectCondition, value, operator);
            case 'date':
                return this.createCondition(DateCondition, value, operator);
            case 'date-in':
                return this.createCondition(DateRangeCondition, value, operator);
            case 'time':
                return this.createCondition(TimeCondition, value, operator);
            case 'time-in':
                return this.createCondition(TimeRangeCondition, value, operator);
            default:
                return this.createCondition(Condition, value, operator);
        }
    }

    public path() {
        if (this.parent && this.parent.name) {
            return this.parent.path() + '.' + this.name;
        }
        return this.name;
    }

    public toString() {
        if (this.isFullLabel !== false && this.parent && this.parent.label) {
            return this.parent.toString() + '/' + this.label;
        }
        return this.label;
    }

    public createCondition(condition, value?: any, operator: string = '=') {
        condition = new condition(this.path(), this.toString(), value, operator);
        condition.required = this.required;
        switch (condition.type) {
            case 'date':
            case 'date-in':
                condition.showTime = this.showTime;
                break;
            default:
                break;
        }
        if (this.min) {
            condition.min = this.min;
        }
        if (this.max) {
            condition.max = this.max;
        }
        if (this.format) {
            condition.format = this.format;
        }
        if (this.options) {
            condition.options = this.options;
        }
        return condition;
    }
}

