// that's right, we're going ES6 bay bee

export default class {
    constructor(name, abbv, hasOT, hasNT, hasAPO) {
        this.name = name;
        this.abbv = abbv;

        if (hasOT == "yes") {
            this.hasOT = true;
        } else {
            this.hasOT = false;
        }

        if (hasNT == "yes") {
            this.hasNT = true;
        } else {
            this.hasNT = false;
        }

        if (hasAPO == "yes") {
            this.hasAPO = true;
        } else {
            this.hasAPO = false;
        }
    }

    toObject() {
        return {
            "name": this.name,
            "abbv": this.abbv,
            "hasOT": this.hasOT,
            "hasNT": this.hasNT,
            "hasAPO": this.hasAPO
        };
    }

    toString() {
        return JSON.stringify(this.toObject());
    }
};