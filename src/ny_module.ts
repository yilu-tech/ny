import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgZorroAntdModule } from 'ng-zorro-antd';

import { NyFormModule } from './forms/form_module';
import { NyModal, NyHeader, NyFooter } from './modal/modal';
import { NyRunNumber } from './animate/run_number';
import { NyTable } from './table/table';
import { NyColumn } from './table/column';
import { SearchInput } from './search/search_input';

@NgModule({
    imports: [CommonModule, FormsModule, NgZorroAntdModule, NyFormModule],
    declarations: [
        NyModal,
        NyHeader,
        NyFooter,
        NyRunNumber,
        NyTable,
        NyColumn,
        SearchInput
    ],

    exports: [
        NyFormModule,
        NyModal,
        NyHeader,
        NyFooter,
        NyTable,
        NyColumn,
        NyRunNumber,
        SearchInput
    ]
})
export class NyModule {
}
