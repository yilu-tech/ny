import { Field, FieldAble } from './field';

export class Model implements FieldAble {
    public parent: Model;

    public name: string;

    public label: string;

    public readonly properties: Map<string, Field> = new Map<string, Field>();

    public readonly relations: Map<string, Model> = new Map<string, Model>();

    constructor(name: string, label: string, parent: Model) {
        this.name = name;
        this.label = label;
        this.parent = parent;
    }

    public static make(fields: any[], name?: string, label?: string, parent?: Model) {
        const model = new Model(name, label, parent);

        for (let field of fields) {
            if (Array.isArray(field.children)) {
                const relation = Model.make(field.children, field.name.replace('.*', ''), field.label, model);
                model.relations.set(relation.name, relation);
            } else {
                field = new Field(field, model);
                model.properties.set(field.name, field);
            }
        }

        return model;
    }

    public getProperty(name: string | string[], matchAll?: boolean): Field {
        if (typeof name === 'string') {
            if (!name) {
                return null;
            }
            name = name.split('.');
        }
        if (!name.length) {
            return null;
        }
        if (name.length === 1) {
            return this.properties.get(name[0]);
        }

        const key = name.pop();
        const model = this.getRelation(name, matchAll);
        return model && model.properties.get(key);
    }

    public getRelation(relation: string | string[], matchAll?: boolean): Model {
        if (typeof relation === 'string') {
            if (!relation) {
                return this;
            }
            relation = relation.split('.');
        }
        if (!relation.length) {
            return this;
        }

        if (this.relations.has(relation[0])) {
            return this.relations.get(relation[0]).getRelation(relation.slice(1), matchAll);
        }

        if (matchAll) {
            return null;
        }

        let match = null;
        this.relations.forEach((item) => {
            const current = item.getRelation(relation);
            if (!match && current) {
                match = current;
            }
        });
        return match;
    }

    public forEach(callback: (field: Field) => void) {
        this.properties.forEach(callback);
        this.relations.forEach((relation) => relation.forEach(callback));
    }

    public path() {
        if (this.parent && this.parent.name) {
            return this.parent.path() + '.' + this.name;
        }
        return this.name;
    }

    public toString() {
        if (this.parent && this.parent.label) {
            return this.parent.toString() + '/' + this.label;
        }
        return this.label;
    }
}

