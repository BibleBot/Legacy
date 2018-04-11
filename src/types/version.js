/** 
 * A Version class which contains the
 * necessary properties for the version database.
 * 
 * @author Elliott Pardee (vypr)
 */
module.exports = class {
    /**
     * Create a Version object to be later
     * inserted into the database.
     * 
     * @param {string} name example: English Standard Version (ESV)
     * @param {string} abbv example: ESV
     * @param {string} hasOT example: yes/no
     * @param {string} hasNT example: yes/no
     * @param {string} hasAPO example: yes/no
     */
    constructor(name, abbv, hasOT, hasNT, hasAPO) {
        this.name = name;
        this.abbv = abbv;

        this.hasOT = false;
        this.hasNT = false;
        this.hasAPO = false;

        if (hasOT === "yes") {
            this.hasOT = true;
        }

        if (hasNT === "yes") {
            this.hasNT = true;
        }

        if (hasAPO === "yes") {
            this.hasAPO = true;
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