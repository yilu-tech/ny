import { Injectable } from '@angular/core';
import * as mock from 'mockjs';
import { CONFIG } from './config';

export class Mock {

    static get(){

    }

    static post(){

    }
    static mock(url,templateFunction?,fn?){
        if(templateFunction){
            mock.mock(url,templateFunction);
        }else if(fn){
            mock.mock(url,templateFunction,fn);
        }else{
            return mock.mock(url);
        }
    }

    static makeMock(){

    }

    static _setUrlHandler(url: any): void {
        if (/^\/?([\w-]+\/?)+$/.test(url)) {
            url = url.trim('/');
            url = CONFIG.baseUrl + '/' + url;
        }
        return url;
    }

}


export class ComplexSearchMock{
    data:[];

    constructor(private url,private total){

    }

    mock(){
        console.log(['mock ComplextSearchMock: '],Mock._setUrlHandler(this.url),this.total)
        this.queryAction();
        Mock.mock(Mock._setUrlHandler(this.url), (options)=>{
            let body = JSON.parse(options.body);
            if(body['action'] == 'fields'){
                return this.fieldsAction();
            }else if(body['action'] == 'query'){
                var data =  this.paginate(body.size,body.page);
                console.log('*******',data);
                return data;
            }
        })
    }

    fieldsAction(){
        return Mock.mock({
            "status": 1,
            "data": {
                "conditions": this.makeCondition(),
                "headers": this.makeHeaders()
            }
        });
    }

    queryAction(){
        var name = `data|${this.total}`;
        var template = {};
        template[name] = [this.makeData()];
        let mockData = Mock.mock(template);
        this.data = mockData.data;
    }

    paginate(size,page){
        let start = size * (page-1);
        let end = size * page;
        let data = {
            data:this.data.slice(start,end),
            total:this.total,
            current_page:page,
            per_page:size
        }
        return data;

    }
    makeCondition(){}
    makeHeaders(){}
    makeData(){}

}
