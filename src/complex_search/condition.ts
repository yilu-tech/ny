import { date, number } from '../forms';
import { ConditionTpl } from './condition_tpl';

const OPERATOR_CN = {
    '=': '等于',
    '>': '大于',
    '>=': '大于等于',
    '<': '小于',
    '<=': '小于等于',
    '<>': '不等于',
    'like': '包含',
    'not like': '不包含',
    'in': '介于'
};

const DATA_TYPE_OPERATORS = {
    'string': ['like', '=', 'not like', '<>'],
    'numeric': ['=', '<>', '>', '>=', '<', '<='],
    'boolean': ['=', '<>'],
    'select': ['=', '<>'],
    'tree-select': ['=', '<>'],
    '*-in': ['in', 'not in'],
};

export class Condition {
    public type = 'string';

    public name: string;
    public label: string;
    public operator: string;

    public hidden: boolean;
    public required: boolean;
    public disabled: boolean;
    public closeable: boolean;

    public hiddenOperator: boolean;

    public parent: ConditionGroup;

    public viewTemplate;
    public inputTemplate;

    public get value() {
        return this._value;
    }

    public set value(value: any) {
        this.setValue(value);

        if (this._dirty) {
            this._checked = !this.isEmpty();
            this._dirty = false;
            this.emit();
        }
    }

    public get checked() {
        return this._checked;
    }

    public set checked(value: boolean) {
        this.check(value);
    }

    public set onChange(fn) {
        this._listener.push(fn);
    }

    public get operatorLabel() {
        return OPERATOR_CN[this.operator];
    }

    public formatter: (value) => any;

    protected _value: any;
    protected _dirty: boolean;
    protected _checked: boolean;
    protected _listener: Function[] = [];

    constructor(name: string, label: string, value?: any, operator: string = '=') {
        this.name = name;
        this.label = label;
        this.setValue(value);
        this.setOperator(operator);
    }

    public setValue(value) {
        if (this._value != value) {
            this._value = value;
            this._dirty = true;
        }
        return this;
    }

    public check(bool?: boolean) {
        if (bool === undefined) {
            bool = !this.checked;
        }

        if (!this.disabled && this.checked != bool) {
            this._checked = bool;

            if (!this.isEmpty()) {
                this.emit();
            }
        }
    }

    public setOperator(operator: string) {
        let operators = this.operators();
        if (operators.indexOf(operator) < 0) {
            operator = operators[0];
        }
        if (this.operator !== operator) {
            this.operator = operator;

            this.emit();
        }
        return this;
    }

    public operators(): string[] {
        let type = /-in$/.test(this.type) ? '*-in' : this.type;
        return DATA_TYPE_OPERATORS[type] || DATA_TYPE_OPERATORS.boolean;
    }

    public isEmpty() {
        return this.value === undefined || this.value === null || this.value === '';
    }

    public valueToString() {
        return this.value;
    }

    public toArray() {
        return [this.name, this.operator, this.formatValue()];
    }

    public toString() {
        return this.label + ' ' + this.operatorLabel + ' ' + this.valueToString();
    }

    public formatValue() {
        if (this.formatter) {
            return this.formatter(this.value);
        }
        return this.value;
    }

    protected emit() {
        this._listener.forEach((fn) => fn(this));
    }
}

export class MultiCondition extends Condition {
    public setValue(value) {
        if (!Array.isArray(value)) {
            value = [];
        }
        return super.setValue(value);
    }

    public operators(): string[] {
        return DATA_TYPE_OPERATORS.boolean;
    }

    public valueToString(): any {
        return this._value.join();
    }

    public isEmpty(): boolean {
        return this._value.length === 0;
    }

    public formatValue() {
        if (this.formatter) {
            return this._value.map(this.formatter);
        }
        return this.value;
    }
}

export class NumericCondition extends Condition {
    public type = 'numeric';

    public get min() {
        return this._min;
    }

    public set min(value) {
        this._min = value;
    }

    public get max() {
        return this._max;
    }

    public set max(value) {
        this._max = value;
    }

    public set format(value) {
        this._format = value;
    }

    public get format() {
        return this._format;
    }

    protected _min: any;
    protected _max: any;
    protected _format: any;

    public formatter = (value) => this.format ? number(value, this.format) : value;
}

export class NumericRangCondition extends MultiCondition {
    public type = 'numeric-in';

    public set minValue(value) {
        if (this._value[0] !== value) {
            this._value[0] = value;
            this._checked = !this.isEmpty();
            this.emit();
        }
    }

    public get minValue() {
        return this._value[0];
    }

    public set maxValue(value) {
        if (this._value[1] !== value) {
            this._value[1] = value;
            this._checked = !this.isEmpty();
            this.emit();
        }
    }

    public get maxValue() {
        return this._value[1];
    }

    public get min() {
        return this._min;
    }

    public set min(value) {
        this._min = value;
    }

    public get max() {
        return this._max;
    }

    public set max(value) {
        this._format = value;
    }

    public set format(value) {
        this._format = value;
    }

    public get format() {
        return this._format;
    }

    protected _min: any;
    protected _max: any;
    protected _format: any;

    protected isEmptyValue(value): boolean {
        return value === null || value === undefined || value === '';
    }

    public isEmpty(): boolean {
        return this.isEmptyValue(this.minValue) && this.isEmptyValue(this.maxValue);
    }

    public operators(): string[] {
        return DATA_TYPE_OPERATORS['*-in'];
    }

    public formatValue(): Array<any> {
        return [this.formatter(this.minValue), this.formatter(this.maxValue)];
    }

    public valueToString() {
        return this.formatValue().map(_ => _ === null ? '*' : _).join(' ~ ');
    }

    public formatter = (value) => this.isEmptyValue(value) ? null : this.format ? number(value, this.format) : value;
}

export class SelectCondition extends Condition {
    public type = 'select';

    public get options() {
        return this._options;
    }

    public set options(value) {
        this._options = Array.isArray(value) ? value : [];
    }

    protected _options: { label: string, value: any }[];

    public valueToString() {
        return this.getValueLabel(this.value);
    }

    protected getValueLabel(value) {
        for (let item of this.options) {
            if (item.value == value) {
                return item.label;
            }
        }
        return value;
    }
}

export class MultipleSelectCondition extends MultiCondition {
    public type = 'select-in';

    public get options() {
        return this._options;
    }

    public set options(value) {
        this._options = Array.isArray(value) ? value : [];
    }

    protected _options: { label: string, value: any }[];

    public valueToString() {
        return this.value.map((v) => this.getValueLabel(v)).join();
    }

    protected getValueLabel(value) {
        for (let item of this.options) {
            if (item.value == value) {
                return item.label;
            }
        }
        return value;
    }
}

export class TreeSelectCondition extends Condition {
    public type = 'tree-select';

    public childNodes: (e) => Promise<Array<any>>;

    public valueToString() {
        if (this.operator === 'in') {
            return this.value.map((v) => this.getValueLabel(v)).join();
        }
        return this.getValueLabel(this.value);
    }

    protected getValueLabel(value) {
        return value;
    }
}

export class DateCondition extends NumericCondition {
    public type = 'date';

    public range = (value) => {
        value = date(this.format, value);
        return (this.min && this.min > value) || (this.max && this.max < value);
    };

    public formatter = (value) => (this.format && value !== null && value !== undefined) ? date(this.format, value) : value;

    public valueToString() {
        return this.formatter(this.value);
    }
}

export class DateRangeCondition extends NumericRangCondition {
    public type = 'date-in';

    public range = (value) => {
        value = date(this.format, value);
        return (this.min && this.min > value) || (this.max && this.max < value);
    };

    public formatter = (value) => (this.format && value !== null && value !== undefined) ? date(this.format, value) : value;
}

export class TimeCondition extends DateCondition {
    public type = 'time';

    protected _format = 'H:i:s';
}

export class TimeRangeCondition extends DateRangeCondition {
    public type = 'time-in';

    protected _format = 'H:i:s';
}

export class ConditionGroup {
    public readonly items: (Condition | ConditionGroup)[] = [];

    public readonly relation: 'or' | 'and';

    public parent: ConditionGroup;

    public checked: boolean;

    public set onChange(fn) {
        this._listener.push(fn);
    }

    protected _listener: Function[] = [];

    protected _templates: ConditionTpl[] = [];

    constructor(relation: 'and' | 'or' = 'and') {
        this.relation = relation;
    }

    public registerTemplate(template: ConditionTpl) {
        this._templates.push(template);
    }

    public getTemplate(condition: Condition, isContainer?: boolean) {
        let template = this._templates.find((tpl: ConditionTpl) => {
            if (tpl.isContainer != isContainer) {
                return false;
            }
            if (tpl.selectorType === 'field') {
                return tpl.name === condition.name;
            }
            return tpl.name === condition.type || tpl.name === 'mixed';
        });
        return template && template.getTemplate();
    }

    public actives() {
        return this.items.filter((e) => e.checked && !e.isEmpty());
    }

    public check(bool = true) {
        this.checked = bool;
        this.items.forEach((condition) => {
            if (condition instanceof ConditionGroup) {
                condition.check(bool);
            } else {
                condition.check();
            }
        });
    }

    public get(name: string): Condition {
        for (let condition of this.items) {
            if (condition instanceof ConditionGroup) {
                continue;
            }
            if (condition.name === name) {
                return condition;
            }
        }
        return null;
    }

    public compare(conditionGroup: ConditionGroup) {
        for (let condition of this.items) {
            if (condition instanceof Condition ||
                condition.relation !== conditionGroup.relation) {
                continue;
            }
            let matched = true;
            for (let item of conditionGroup.items) {
                if (item instanceof ConditionGroup) {
                    if (!condition.match(item)) {
                        matched = false;
                        break;
                    }
                } else {
                    if (!condition.get(item.name)) {
                        matched = false;
                        break;
                    }
                }
            }
            if (matched) {
                return condition;
            }
        }
        return null;

    }

    public match(conditionGroup: ConditionGroup): ConditionGroup {
        for (let condition of this.items) {
            if (condition instanceof Condition ||
                condition.relation !== conditionGroup.relation) {
                continue;
            }
            let matched = true;
            for (let item of conditionGroup.items) {
                if (item instanceof ConditionGroup) {
                    if (!condition.match(item)) {
                        matched = false;
                        break;
                    }
                } else {
                    if (!condition.get(item.name)) {
                        matched = false;
                        break;
                    }
                }
            }
            if (matched) {
                return condition;
            }
        }
        return null;
    }

    public add(condition: Condition) {
        let match = this.get(condition.name);
        if (match) {
            match.operator = condition.operator;
            match.checked = true;
            match.value = condition.value;
        } else {
            this.append(condition);
        }
    }

    public append(condition: Condition) {
        condition.onChange = this.emit;
        condition.parent = this;
        if (!condition.inputTemplate) {
            condition.inputTemplate = this.getTemplate(condition);
        }
        if (!condition.viewTemplate) {
            condition.viewTemplate = this.getTemplate(condition, true);
        }
        this.items.push(condition);
        if (condition.checked && !condition.isEmpty()) {
            this.emit(condition);
        }
    }

    public remove(condition: Condition | ConditionGroup) {
        if (condition instanceof Condition && !condition.closeable) {
            return false;
        }
        let index = this.items.indexOf(condition);
        if (index > -1) {
            this.items.splice(index, 1);
            if (this.items.length === 0 && this.parent) {
                this.parent.remove(this);
            } else if (!condition.isEmpty()) {
                this.emit(condition);
            }
        }
    }

    public clear() {
        const exist = this.items.length > 0;
        this.items.length = 0;
        if (exist) {
            this.emit(null);
        }
    }

    public isEmpty() {
        return this.actives().length === 0;
    }

    public toArray() {
        return this.actives().map((condition) => {
            if (condition instanceof ConditionGroup) {
                let array = condition.toArray();
                return array.length === 1 ? array[0] : array;
            }
            return condition.toArray();
        });
    }

    public toString() {
        let separator = this.relation === 'and' ? ' 且 ' : ' 或 ';
        return this.actives().map((condition) => {
            if (condition instanceof ConditionGroup) {
                return '(' + condition.toString() + ')';
            }
            return condition.toString();
        }).join(separator);
    }

    protected emit = (condition: Condition | ConditionGroup) => {
        this._listener.forEach((fn) => fn(condition));
    };
}
