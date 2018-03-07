export default class {
    constructor(name, rawobj, defversion) {
        this.name = name;
        this.rawobj = rawobj;
        this.defversion = defversion;

        this.getName = this.getName.bind(this);
        this.getRawObject = this.getRawObject.bind(this);
        this.getDefaultVersion = this.getDefaultVersion.bind(this);

        this.toObject = this.toObject.bind(this);
        this.toString = this.toString.bind(this);
    }

    getName() {
        return this.name;
    }

    getRawObject() {
        return this.rawobj;
    }

    getDefaultVersion() {
        return this.defversion;
    }

    toObject() {
        return {
            name: this.getName(),
            rawobj: this.getRawObject(),
            defversion: this.getDefaultVersion()
        };
    }

    toString() {
        return JSON.stringify(this.toObject());
    }
}
