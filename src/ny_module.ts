import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgZorroAntdModule } from 'ng-zorro-antd';

import { NyFormModule } from './forms/form_module';
import { NyModal, NyHeader, NyFooter } from './modal/modal';
import { NyRunNumber } from './animate/run_number';
import { NyTable } from './table/table';

@NgModule({
    imports: [CommonModule, NgZorroAntdModule, NyFormModule],
    declarations: [
        NyModal,
        NyHeader,
        NyFooter,
        NyRunNumber,
        NyTable
    ],

    exports: [
        NyFormModule,
        NyModal,
        NyHeader,
        NyFooter,
        NyTable,
        NyRunNumber,
    ]
})
export class NyModule {
}
