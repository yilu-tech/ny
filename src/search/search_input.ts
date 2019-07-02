import { Component, OnChanges, OnInit, DoCheck, Renderer2, Input, Output, EventEmitter, SimpleChanges, ElementRef } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { Api, date } from '../public_api';
import { Collection } from './collection';

type Condition = {
    name: string,      // 字段名称
    label: string,      // 字段显示名称
    ctype: string,      // 条件类型
    itype: string,      // 数据类型
    value: number | string | Date | (number | string | Date)[],
    display: boolean,
    checked: boolean,
    operator: string,
    options?: any[],
    range?: (number | string | Function)[] | Function,
    format?: string,
    selectModel?: 'multiple' | 'default'
    valueLabel?: string | string[],
    childNodes?: (e) => Promise<Array<any>>
};

@Component({
    selector: 'ny-search-input',
    templateUrl: 'search_input.html',
    styleUrls: ['search_input.scss'],
})
export class SearchInput implements OnChanges, OnInit {
    public kIndex: number = 0;
    public keyword: string;
    public keywordHistory: string;
    public keywordFocus: boolean = false;
    public dropDownVisible: boolean;

    public isSimple: boolean;

    public fields: any[] = [];
    public keywordFields: any[] = [];
    public conditions: Condition[][] = [];
    public conditionLabels: any[] = [];
    public editConditions: Condition[] = [];
    public operators: any[] = [];

    public headers: any[] = [];
    public visible: boolean = false;
    public originalFields: any[] = [];
    public originData: any[] = [];
    showSearchBtn: boolean = true;

    @Input() set uri(_: string) {
        this.$collection.uri = _;
    };

    @Input() set pageSize(_: number) {
        this.$collection.size = _;
    };

    @Input() max: number = 5;
    @Input() orMax: number = 5;
    @Input() showExtraCondition: boolean;
    @Input() fieldOptions: any;
    @Output() collection: EventEmitter<Collection> = new EventEmitter();

    public op_cn = {
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

    public CO = {
        'string': ['like', '=', 'not like', '<>'],
        'numeric': ['=', '<>', '>', '>=', '<', '<=', 'in'],
        'boolean': ['=', '<>'],
        'only': ['=', '<>', 'in'],
        'json': ['like', 'not like'],
        'date': ['=', '<>', '>', '>=', '<', '<=', 'in'],
        'select': ['=']
    };

    private _hiddenListener: any;
    private _timer: any;

    public $collection: Collection;

    constructor(private api: Api, private renderer: Renderer2, private notificationService: NzNotificationService) {
        this.$collection = new Collection();

        this.$collection.request = this.api.request.bind(this.api);
    }

    public ngOnChanges(changes: SimpleChanges) {

    }

    public ngOnInit() {

        this.$collection.addWhere = (name, value, operator = '=') => {
            let field = this.findField(name);
            if (!field) {
                return null;
            }
            let condition = [this.makeCondition({...field, operator}, value)];
            if (this.setSameCondition(condition)) {
                this.conditionChange();
            } else {
                this.conditions.push(condition);
                this.valueChange(condition[0]);
            }
        };
        this.collection.emit(this.$collection);
        this.$collection.resetHeader = () => this.initControls(false);
        this.initControls();
    }

    public initControls(inCache = true) {
        this.keywordFields = [];
        this.conditions = [];
        this.api.post(this.$collection.uri, {action: 'prepare'}, {inCache}).then((ret) => {

            this.originalFields = ret.fields || ret.conditions || [];

            this.isSimple = ret.display === 'simple';

            if (ret.conditions) {
                ret.conditions.forEach((item) => item.display = true);
                let showConditions = ret.conditions.filter(item => !item.hidden) || [];
                if (showConditions.length) {
                    this.showSearchBtn = true;
                } else {
                    this.showSearchBtn = false;
                }
            } else {
                this.showSearchBtn = false;
            }

            this.formatFields(this.originalFields);

            // if (this.isSimple) this.conditions.forEach((item) => item[0].checked = true);

            this.$collection.setHeader(this.makeHeaders(ret.headers));

            this.$collection.init();
            this.conditionChange();
        });
    }

    public makeHeaders(fields: string[]) {
        return fields.map((item: any) => {
            let field = this.parseField(typeof item === 'object' ? item.value : item);
            let value = item.cascade && field.path.length ? [...field.path, field.name] : (field.rename || field.name);
            let match = this.findField(field);
            let header: any;
            if (typeof item === 'object') {
                header = {label: match ? match.label : '', ...item, value, field: item.value};
            } else {
                if (!match) {
                    return;
                }
                header = {value, label: match.label, field: item};
            }
            if (match && match.options) {
                header.map = match.options;
            }
            return header;
        }).filter((item) => item);
    }

    public formatFields(fields: any[], path: string = '', prefix: string = '') {
        for (let item of fields) {
            item = {...item};
            if (path) {
                item.name = path + '.' + item.name;
            }
            if (item.children) {
                item.name = item.name.slice(0, -2);
            } else if (item.isFullLabel !== false) {
                item.label = prefix + item.label;
            }
            if (this.fieldOptions && this.fieldOptions[item.name]) {
                Object.assign(item, this.fieldOptions[item.name]);
            }
            if (item.children) {
                this.formatFields(item.children, item.name, item.label + '/');
            } else {
                if (!item.custom) {
                    this.fields.push(item);
                }
                if (item.ctype === 'tree-select' && item.childNodes) {
                    item.map = item.childNodes().then((nodes) => {
                        // item.options = nodes;
                        this.conditions.forEach(collection => {
                            collection.forEach(_ => {
                                if (_.name.indexOf(item.name) != -1) {
                                    _.options = nodes;
                                }
                            });
                        });
                    });
                }
                if (!this.isSimple && (item.itype === 'string' || item.ctype === 'keyword')) {
                    this.keywordFields.push(item);
                } else if (item.ctype) {
                    this.conditions.push([this.makeCondition(item, item.value, item.operator || '=')]);
                }
            }
        }
    }

    public makeCondition(field: any, value?: any, operator = '='): Condition {
        let condition: Condition = {...field};
        condition.value = (value === undefined ? field.value : value);
        condition.operator = operator;
        condition.range = condition.range || [];
        if (!condition.ctype) {
            condition.ctype = field.itype;
        }

        if (condition.ctype === 'select' || condition.ctype === 'radio' || condition.ctype === 'multiple') {
            condition.options = field.options || [];
            if (condition.ctype === 'multiple') {
                condition.selectModel = 'multiple';
                if (!Array.isArray(condition.value)) {
                    condition.value = [condition.value];
                }
            } else {
                condition.selectModel = 'default';
            }
            condition.ctype = 'select';
        } else if (condition.ctype === 'date' || condition.ctype === 'date-in') {
            condition.range = (_date) => {
                _date = date(condition.format, _date);
                return (condition.range[0] && condition.range[0] > _date) || (condition.range[1] && condition.range[1] < _date);
            };
        }
        if (/-in$/.test(condition.ctype)) {
            condition.operator = 'in';
            if (!Array.isArray(condition.value)) {
                condition.value = [condition.value];
            }
        }
        if (condition.value && condition.options) {
            if (Array.isArray(condition.value)) {
                condition.valueLabel = condition.value.map((item) => this.getValueLabel(item, condition.options));
            } else {
                condition.valueLabel = this.getValueLabel(condition.value, condition.options);
            }
        }
        return condition;
    }

    public keywordChange(event: Event) {
        switch (event['keyCode']) {
            case 8:
                if (!this.keywordHistory && this.conditionLabels.length) {
                    this.check(this.conditionLabels[this.conditionLabels.length - 1].items, false);
                    this.kIndex = 0;
                }
                break;
            case 13:
                if (this.keywordFields.length) {
                    this.addKeywordCondition(this.keywordFields[this.kIndex]);
                }
                break;
            case 38:
                this.kIndex -= 1;
                if (this.kIndex < 0) {
                    this.kIndex = this.keywordFields.length - 1;
                }
                break;
            case 40:
                this.kIndex += 1;
                if (this.kIndex >= this.keywordFields.length) {
                    this.kIndex = 0;
                }
                break;
            default:
                break;
        }
        this.keywordHistory = this.keyword;
    }

    public blur() {
        setTimeout(() => {
            this.keywordFocus = false;
            this.keywordHistory = this.keyword = '';
        });
    }

    public addKeywordCondition(field: any) {
        let keyword = this.keyword.trim();
        if (!keyword || !this.validateConditionLength()) {
            return;
        }
        let condition = this.makeCondition(field, keyword, 'like');
        if (!this.setSameCondition([condition])) {
            this.conditions.push([condition]);
        }
        condition.checked = true;
        this.keywordHistory = this.keyword = '';
        this.kIndex = 0;
        this.conditionChange();
    }

    public conditionChange() {
        let params = [];
        this.conditionLabels = [];
        this.conditions.forEach((items, index) => {
            items = items.filter((item) => (this.isSimple || (!this.isSimple && item.checked)) && !this.isEmpty(item));
            if (items.length === 1) {
                params.push([items[0].name, items[0].operator, this.value(items[0])]);
            } else if (items.length > 1) {
                params.push(items.map((item) => [item.name, item.operator, this.value(item)]));
            }
            if (items.length) {
                this.conditionLabels.push({
                    label: items.map((item) => this.getConditionLabel(item)).join(' 或 '), index, items
                });
            }
        });
        this.$collection.params = params;
        this.$collection.change('condition');
    }

    public value(condition: Condition) {
        if (/(time)|(date)/.test(condition.ctype)) {
            return condition.valueLabel || condition.value;
        }
        return condition.value;
    }

    public removeCondition(index, i = null) {
        if (i === null) {
            this.editConditions.splice(index, 1);
        } else {
            let checked = this.conditions[i][index].checked;
            this.conditions[i].splice(index, 1);
            if (!this.conditions[i].length) {
                this.conditions.splice(i, 1);
            }
            if (checked) {
                this.conditionChange();
            }
        }
    }

    public apply() {
        if (!this.editConditions.length) {
            return;
        }

        this.editConditions.forEach((item) => item.checked = true);
        if (!this.setSameCondition(this.editConditions)) {
            this.conditions.push(this.editConditions);
        }
        this.editConditions = [];
        this.operators = [];
        this.conditionChange();
    }

    public getConditionLabel(condition: Condition) {
        let value = condition.valueLabel || condition.value;
        if (condition.ctype === 'checkbox') {
            return condition.label;
        }
        if (value instanceof Array) {
            value = value.join(condition.ctype === 'select' ? ',' : '~');
        }
        return condition.label + ' ' + this.op_cn[condition.operator] + ' ' + '"' + value + '"';
    }

    public startEditCondition() {
        if (this.editConditions.length) {
            this.editConditions = [];
        } else {
            this.addEditCondition();
        }
    }

    public filedChange(index: number, name: string) {
        for (let item of this.fields) {
            if (item.name === name) {
                this.editConditions[index] = this.makeCondition(item, undefined);
                break;
            }
        }
        let ctype = this.editConditions[index].ctype === 'select' ? 'select' : this.editConditions[index].itype;
        this.operators[index] = this.CO[ctype].map((item) => {
            return {'label': this.op_cn[item], 'value': item};
        });
    }

    public operatorChange(index: number, operator: string) {
        let condition = this.editConditions[index];
        if (operator === 'in') {
            condition.ctype += '-in';
            condition.value = condition.value instanceof Array ? condition.value : [];
        } else if (condition.ctype.indexOf('-in') > 0) {
            condition.ctype = condition.ctype.replace('-in', '');
            condition.value = condition.value[0];
        }
    }

    public valueChange(condition: Condition, isEdit = true) {
        let checked = condition.checked;
        condition.valueLabel = this.makeValueLable(condition);
        if (!this.isSimple) {
            if (this.isEmpty(condition)) {
                condition.checked = false;
            } else if (isEdit === false) {
                checked = condition.checked = true;
            }
            if (!checked) {
                return;
            }
        }
        this.conditionChange();
    }

    public reduceValueChange(condition: Condition) {
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._timer = setTimeout(() => this.valueChange(condition), 500);
    }

    public addEditCondition() {
        if (this.editConditions.length > this.orMax) {
            this.notificationService.warning('警告信息', '超过最大条件数量 "' + this.orMax + '" 限制');
            return;
        }
        let condition = this.makeCondition(this.fields[0], null);
        let index = this.editConditions.push(condition) - 1;
        let ctype = condition.ctype === 'select' ? 'select' : condition.itype;
        this.operators[index] = this.CO[ctype].map((item) => {
            return {label: this.op_cn[item], value: item};
        });
        condition.operator = this.operators[index][0].value;
    }

    public check(condition, status: boolean) {
        if (status && !this.validateConditionLength()) {
            return;
        }

        if (Array.isArray(condition)) {
            condition.forEach((item) => item.checked = status);
        } else {
            condition.checked = status;
        }
        this.conditionChange();
    }

    public selectStatusChange(e) {
        if (e) {
            this.removeHiddenListener();
        } else {
            setTimeout(() => this.bindHiddenListener());
        }
    }

    public bindHiddenListener(event?: any) {
        if (event) {
            event.stopPropagation();
        }
        if (!this.dropDownVisible) {
            this.dropDownVisible = true;
        } else if (this._hiddenListener) {
            this.dropDownVisible = false;
        }
        this.removeHiddenListener();
        if (!this._hiddenListener && this.dropDownVisible) {
            this._hiddenListener = this.renderer.listen('document', 'click', () => {
                this.removeHiddenListener();
                this.dropDownVisible = false;
            });
        }
    }

    public removeHiddenListener() {
        if (this._hiddenListener) {
            this._hiddenListener();
            this._hiddenListener = null;
        }
    }

    private isEmpty(condition: Condition) {
        if (condition.ctype === 'checkbox') {
            return !condition.checked;
        }
        if (condition.ctype === 'select' || condition.ctype === 'tree-select') {
            if (condition.selectModel !== 'multiple') {
                return condition.value === undefined || condition.value === null;
            }
            return !Array.isArray(condition.value) || !condition.value.length;
        }
        return (condition.value === undefined || condition.value === '') ||
            (Array.isArray(condition.value) && condition.value[0] === undefined && condition.value[1] === undefined);
    }

    private setSameCondition(items: Condition[]) {
        for (let subItems of this.conditions) {
            if (subItems.length !== items.length || subItems === items) {
                continue;
            }
            let matchLen = 0;
            for (let i = 0; i < items.length; i++) {
                if (subItems[i].name === items[i].name &&
                    subItems[i].operator === items[i].operator
                //  &&(subItems[i].value === items[i].value || items[i].ctype === 'select')
                ) {
                    matchLen += 1;
                }
            }
            if (matchLen === items.length) {
                subItems.forEach((item, i) => {
                    item.checked = true;
                    // if (item.ctype === 'select') {
                    item.value = items[i].value;
                    item.valueLabel = this.makeValueLable(item);
                    // }
                });
                return true;
            }
        }
        return false;
    }

    private validateConditionLength() {
        let checked = this.conditions.filter((i) => i.filter((i) => i.checked).length);
        if (checked.length >= this.max) {
            this.notificationService.warning('警告信息', '超过最大条件数量 "' + this.max + '" 限制');
            return false;
        }
        return true;
    }

    private makeValueLable(condition: Condition) {
        if (condition.ctype === 'select') {
            if (Array.isArray(condition.value)) {
                return condition.value.map((item) => this.getValueLabel(item, condition.options));
            } else {
                return this.getValueLabel(condition.value, condition.options);
            }
        } else if (condition.value instanceof Array) {
            return condition.value.map((item: any) => {
                if (item instanceof Date) {
                    return date(condition.ctype === 'time-in' ? 'H:i:s' : condition.format, item);
                }
                return item;
            });
        } else if (condition.value instanceof Date) {
            return date(condition.ctype === 'time' ? 'H:i:s' : condition.format, condition.value);
        } else if (condition.ctype === 'tree-select') {
            return this.getValueLabel(condition.value, condition.options, 'title', 'key');
        }
        return condition.value;
    }

    private getValueLabel(value, options: any[], labelKey = 'label', valueKey = 'value') {
        for (let item of options) {
            if (item[valueKey] === value) {
                return item[labelKey];
            }
            if (item.children) {
                let label = this.getValueLabel(value, item.children, labelKey, valueKey);
                if (label) {
                    return label;
                }
            }
        }
    }

    private findField(field: any) {
        if (typeof field === 'string') {
            field = this.parseField(field);
        }
        let list = [{fields: this.originalFields, path: []}];
        while (list.length) {
            let node = list.shift();
            for (let item of node.fields) {
                if ((this.isSimple && field.fullname === item.name) ||
                    (item.name === field.name && this.hasPath(node.path, field.path))) {
                    return {...item};
                }
                if (item.children) {
                    list.push({fields: item.children, path: item.name.slice(0, -2).split('.')});
                }
            }
        }
        return null;
    }

    private _forEach(array: Array<any>, callback: Function, childKey = 'children') {
        let items = [{item: array, parent: null}];
        while (items.length) {
            let curr = items.pop();
            for (let i = 0; i < curr.item.length; i++) {
                callback(curr.item[i], i, curr.parent);
                if (Array.isArray(curr.item[i][childKey])) {
                    items.push({item: curr.item[childKey], parent: curr.item});
                }
            }
        }
    }

    private parseField(name: string) {
        let argv = name.split('|');
        let field: any = {rename: argv[1]};
        field.fullname = argv[0];
        field.path = argv[0].split('.');
        field.name = field.path.pop();
        return field;
    }

    private hasPath(path: string[], sub: string[]) {
        if (sub.length > path.length) {
            return false;
        }
        for (let i = sub.length - 1; i >= 0; i--) {
            let j = path.length - sub.length + i;
            if (sub[i] !== path[j]) {
                return false;
            }
        }
        return true;
    }
}
