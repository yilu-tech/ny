import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgZorroAntdModule } from 'ng-zorro-antd';

import { NyFormModule } from './forms/form_module';
import { NyModal, NyHeader, NyFooter } from './modal/modal';
import { NyRunNumber } from './animate/run_number';
import { NyTable } from './table/table';
import { SearchInput } from './search/search_input';

@NgModule({
    imports: [CommonModule, FormsModule, NgZorroAntdModule, NyFormModule],
    declarations: [
        NyModal,
        NyHeader,
        NyFooter,
        NyRunNumber,
        NyTable,
        SearchInput
    ],

    exports: [
        NyFormModule,
        NyModal,
        NyHeader,
        NyFooter,
        NyTable,
        NyRunNumber,
        SearchInput
    ]
})
export class NyModule {
}
