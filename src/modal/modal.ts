import {
    Component,
    OnChanges,
    OnInit,
    AfterViewChecked,
    Output,
    EventEmitter,
    ViewChild,
    ElementRef,
    Renderer2,
    Input,
    Host,
    Optional,
    HostBinding,
} from '@angular/core';

@Component({
    selector: 'ny-modal',
    styleUrls: ['./modal.scss'],
    template: `
        <div #header class="header">
            <div class="header-content"><h2>{{title}}</h2></div>
            <div class="header-action">
                <i class="anticon anticon-close" (click)="close()"></i>
            </div>
        </div>
        <div #content class="content">
            <ng-content></ng-content>
        </div>`
})

export class NyModal implements OnChanges, OnInit, AfterViewChecked {
    @Input() visible: boolean;
    @Input() appendTo: string | HTMLElement;
    @Input() isFull: boolean;
    @Input() size: string;
    @Input() title: string;

    @Output() visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() onOpen: EventEmitter<any> = new EventEmitter<any>();
    @Output() onClose: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('header') header: ElementRef;
    @ViewChild('content') content: ElementRef;

    @HostBinding('style.display') get display() {
        return this.visible ? 'flex' : 'none';
    }

    private _container: HTMLElement;
    private _containerRect: any;

    constructor(private renderer: Renderer2, private elRef: ElementRef) {

    }

    public ngOnChanges(changes) {
        if ('visible' in changes && changes.visible.currentValue) {
            if (this.visible) this.onOpen.emit();
        }
    }

    public ngOnInit() {
        this._getContainer();

        this._containerRect = this._getContainerRect();
        this._setPosition();
    }

    public ngAfterViewChecked() {
        if (!this.visible) return;

        let rect = this._getContainerRect();
        if (rect.widthRef !== this._containerRect.widthRef ||
            rect.heightRef !== this._containerRect.heightRef ||
            rect.left !== this._containerRect.left ||
            rect.top !== this._containerRect.top ||
            rect.right !== this._containerRect.right ||
            rect.bottom !== this._containerRect.bottom) {
            this._containerRect = rect;
            this._setPosition();
        }
    }

    public addHeader(headerEl) {
        this.renderer.removeChild(this.header.nativeElement, this.header.nativeElement.firstElementChild);
        this.renderer.insertBefore(this.header.nativeElement, headerEl, this.header.nativeElement.firstElementChild);
    }

    public addFooter(footerEl) {
        this.renderer.appendChild(this.elRef.nativeElement, footerEl);
    }

    public close() {
        this.visible = false;
        this.visibleChange.emit(false);
        this.onClose.emit();
    }

    public getWidth() {
        let width = this._containerRect.right - this._containerRect.left;
        switch (this.size) {
            case 'xs':
                return width * 0.3;

            case 'sm':
                return width * 0.4;

            case 'md':
                return width * 0.5;

            case 'lg':
                return width * 0.6;

            case 'xl':
                return width * 0.7;

            case 'xxl':
                return width * 0.8;

            default:
                return this._containerRect.widthRef || (width * 0.5);
        }
    }

    private _getContainer() {
        if (!this.appendTo) this.appendTo = 'body';

        if (typeof this.appendTo === 'string') {
            this._container = document.querySelector(this.appendTo);
        } else if (this.appendTo instanceof Element) {
            this._container = this.appendTo;
        }

        if (!this._container) throw new Error('container not found');
    }

    private _getContainerRect() {
        let rect: any = this._container.getBoundingClientRect();
        //nz-content下有footer的情况下，高度不够全屏下，获取填充高度
        let fillHeight = window.innerHeight - rect.bottom;
        if (fillHeight < 0) {
            fillHeight = 0;
        }

        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top + fillHeight;
        rect.screenWidth = window.innerWidth;
        rect.screenHeight = window.innerHeight;

        let rectRef = this._getRectFef();
        rect.widthRef = rectRef.right - rectRef.left;
        rect.heightRef = rectRef.bottom - rectRef.top;

        return rect;
    }

    private _getRectFef() {
        if (this._containerRect && !this.isFull) {
            this.renderer.setStyle(this.elRef.nativeElement, 'width', null);
            this.renderer.setStyle(this.elRef.nativeElement, 'height', null);
        }

        let rect = this.elRef.nativeElement.getBoundingClientRect();

        if (this._containerRect && !this.isFull) {
            this._setSize();
        }

        return rect;
    }

    private _setSize() {
        let width = Math.min(this.getWidth(), this._containerRect.width);
        this.renderer.setStyle(this.elRef.nativeElement, 'width', width + 'px');

        let height = Math.min(this._containerRect.height, this._containerRect.heightRef);
        this.renderer.setStyle(this.elRef.nativeElement, 'height', height + 'px');
    }

    private _setPosition() {
        // let left = this._containerRect.left + 8;
        // let top = this._containerRect.top + 8;
        let left = this._containerRect.left;
        let top = this._container.offsetTop; //容器距离订单的高度
        if (!this.isFull) {
            left += Math.max((this._containerRect.width - this.getWidth()) / 2, 0);
            top += Math.max((this._containerRect.height - this._containerRect.heightRef) / 2, 0);
            this._setSize();
        }
        this.renderer.setStyle(this.elRef.nativeElement, 'left', left + 'px');
        this.renderer.setStyle(this.elRef.nativeElement, 'top', top + 'px');

        if (this.isFull) {
            this.renderer.setStyle(this.elRef.nativeElement, 'right', Math.max(this._containerRect.screenWidth - this._containerRect.right, 8) + 'px');
            this.renderer.setStyle(this.elRef.nativeElement, 'bottom', Math.max(this._containerRect.screenHeight - this._containerRect.bottom, 8) + 'px');
        }
    }
}

@Component({
    selector: 'ny-header',
    template: '<ng-content></ng-content>'
})

export class NyHeader implements OnInit {

    constructor(@Optional() @Host() public modal: NyModal, private el: ElementRef) {

    }

    public ngOnInit() {
        if (this.modal) {
            this.modal.addHeader(this.el.nativeElement);
        }
    }
}

@Component({
    selector: 'ny-footer',
    template: '<ng-content></ng-content>'
})

export class NyFooter implements OnInit {

    constructor(@Optional() @Host() public modal: NyModal, private el: ElementRef) {

    }

    public ngOnInit() {
        if (this.modal) {
            this.modal.addFooter(this.el.nativeElement);
        }
    }
}
