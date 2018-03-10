/**
 * The possible events that a
 * handler can handle.
 */
let possibleEvents = {
    COMMAND_EVENT: 0,
    VERSE_EVENT: 1,
    NO_EVENT: 2,
};

/**
 * A base Handler class that can be
 * used by the actual handlers to extend off of.
 * 
 * This is simply a basic layout.
 * 
 * @author Elliott Pardee (vypr)
 */
export default class {
    /**
     * Creates a Handler object.
     * 
     * @param {string} handling The type of event that this handler will be handling.
     * Options are COMMAND_EVENT, VERSE_EVENT, or NO_EVENT.
     */
    constructor(handling) {
        if (typeof handling !== "string") {
            return TypeError("argument must be a string");
        }

        let index = Object.keys(possibleEvents).indexOf(handling);
        if (index === -1) {
            return Error("argument must be COMMAND_EVENT, VERSE_EVENT, or NO_EVENT");
        }

        this.eventsHandling = index;
    }
}
