import { Injectable } from '@angular/core';
import * as mock from 'mockjs';
import { CONFIG } from './config';

export class Mock {

    static get(){

    }

    static post(){

    }
    static mock(url,templateFunction?,fn?){
        console.log('mock->',url,templateFunction,fn);
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


export class ComplextSearchMock{

    constructor(private url,private total){

    }

    mock(){
        console.log(['mock ComplextSearchMock: '],Mock._setUrlHandler(this.url),this.total)
        Mock.mock(Mock._setUrlHandler(this.url), (options)=>{
            let body = JSON.parse(options.body);
            if(body['action'] == 'fields'){
                return this.fieldsAction();
            }else if(body['action'] == 'query'){
                return this.queryAction();
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
        var template = {
            total:this.total
        };
        template[name] = [this.makeData()];
        return Mock.mock(template);
    }
    makeCondition(){}
    makeHeaders(){}
    makeData(){}

}
