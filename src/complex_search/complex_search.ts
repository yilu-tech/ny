import {
    Component,
    OnChanges,
    OnInit,
    Renderer2,
    Input,
    Output,
    EventEmitter,
    SimpleChanges,
    ViewChildren,
    ContentChildren,
    QueryList
} from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd';
import { Http } from '../providers';
import { Collection } from './collection';
import { Field } from './field';
import { ConditionGroup } from './condition';
import { ConditionTpl } from './condition_tpl';
import { Model } from './model';

@Component({
    selector: 'ny-complex-search',
    templateUrl: 'complex_search.html',
    styleUrls: ['complex_search.scss'],
})
export class ComplexSearch implements OnChanges, OnInit {
    public kIndex: number = 0;
    public keyword: string;
    public keywordHistory: string;
    public keywordFocus: boolean = false;
    public dropDownVisible: boolean;

    public isSimple: boolean;

    public visible: boolean = false;
    public showSearchBtn: boolean = true;

    public stringFields: Field[] = [];

    @Input() set uri(_: string) {
        this.collection.uri = _;
    };

    @Input() set pageSize(_: number) {
        this.collection.size = _;
    };

    @Input() max: number = 5;
    @Output('collection') collectionEmitter: EventEmitter<Collection> = new EventEmitter();

    @ViewChildren(ConditionTpl) defaultConditionTpl: QueryList<ConditionTpl>;
    @ContentChildren(ConditionTpl) customConditionTpl: QueryList<ConditionTpl>;

    public collection: Collection;
    public conditions: ConditionGroup;

    private _hiddenListener: any;

    constructor(private http: Http, private renderer: Renderer2, private notificationService: NzNotificationService) {
        this.collection = new Collection(http);
        this.conditions = this.collection.conditions;
    }

    public ngOnChanges(changes: SimpleChanges) {

    }

    public ngOnInit() {
        this.collectionEmitter.emit(this.collection);
        this.collection.resetHeader = () => this.initControls(false);
        this.initControls();
    }

    protected registerConditionTemplate() {
        const type = this.isSimple ? 'simple' : 'default';
        const register = (item: ConditionTpl) => {
            if (item.type === type || item.type === 'mixed') {
                this.conditions.registerTemplate(item);
            }
        };
        this.customConditionTpl.forEach((item) => register(item));
        this.defaultConditionTpl.forEach((item) => register(item));
    }

    public initControls(inCache = true) {
        this.http.post(this.collection.uri, {action: 'prepare'}, {inCache}).then((ret) => {
            this.isSimple = ret.display === 'simple';
            this.registerConditionTemplate();

            this.collection.model = Model.make(ret.fields || ret.conditions || []);
            this.initConditions();

            this.collection.setHeader(this.parseHeaders(ret.headers));
            this.collection.init();
        });
    }

    public initConditions() {
        this.stringFields = [];
        this.conditions.clear();
        this.collection.model.forEach(field => {
            if (field.itype === 'string' || field.ctype === 'keyword') {
                this.stringFields.push(field);
            }
            if (this.isSimple || (field.ctype && field.ctype !== 'keyword')) {
                this.conditions.add(field.newCondition());
            }
        });
    }

    public parseHeaders(fields: any[]) {
        return fields.map((item) => {
            const field = this.parseField(typeof item === 'object' ? item.value : item);
            const value = item.cascade && field.path.length ? [...field.path, field.name] : (field.rename || field.name);
            const match = this.collection.model.getProperty(field.fullname);

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

    public keywordChange(event: Event) {
        switch (event['keyCode']) {
            case 8:
                if (!this.keywordHistory) {
                    let condition;
                    for (let item of this.conditions.items) {
                        if (item.used && !item.required) {
                            condition = item;
                        }
                    }
                    if (condition) {
                        condition.check(false);
                    }
                    this.kIndex = 0;
                }
                break;
            case 13:
                if (this.stringFields.length) {
                    this.addKeywordCondition(this.stringFields[this.kIndex]);
                }
                break;
            case 38:
                this.kIndex -= 1;
                if (this.kIndex < 0) {
                    this.kIndex = this.stringFields.length - 1;
                }
                break;
            case 40:
                this.kIndex += 1;
                if (this.kIndex >= this.stringFields.length) {
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

    public addKeywordCondition(field: Field) {
        let keyword = this.keyword && this.keyword.trim();

        if (!keyword || !this.validateConditionLength()) {
            return;
        }

        let condition = field.newCondition(keyword, 'like');

        condition.checked = true;
        condition.closeable = true;

        this.conditions.add(condition);

        this.keywordHistory = this.keyword = '';
        this.kIndex = 0;
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
            this._hiddenListener = this.renderer.listen('document', 'click', (event) => {
                for (let element of event.path) {
                    if (element.className && element.className.indexOf('cdk-overlay-container') > -1) {
                        return;
                    }
                }
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

    private validateConditionLength() {
        if (this.conditions.actives().length >= this.max) {
            this.notificationService.warning('警告信息', '超过最大条件数量 "' + this.max + '" 限制');
            return false;
        }
        return true;
    }

    private parseField(name: string) {
        let argv = name.split('|');
        let field: any = {rename: argv[1]};
        field.fullname = argv[0];
        field.path = argv[0].split('.');
        field.name = field.path.pop();
        return field;
    }
}
