import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgZorroAntdModule } from 'ng-zorro-antd';

import { DefaultValueAccessor } from './default_value_accessor';
import { NyGroupDirective } from './group';
import { NyFormDirective } from './form';
import { NyInputDirective, NyDeepInputDirective } from './input';
import { TableInput } from './table/table';

@NgModule({
    imports: [CommonModule, FormsModule, NgZorroAntdModule],
    declarations: [
        NyFormDirective,
        NyGroupDirective,
        NyInputDirective,
        NyDeepInputDirective,
        DefaultValueAccessor,
        TableInput
    ],
    exports: [
        NyFormDirective,
        NyGroupDirective,
        NyInputDirective,
        NyDeepInputDirective,
        DefaultValueAccessor,
        TableInput
    ]
})
export class NyFormModule {

}
