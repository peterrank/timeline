/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
class SliderValue {
    constructor(v, n) {
        this.value = v;
        this.name = n;
    }

    toString() {
        return JSON.stringify(this);
    }
}

export default SliderValue
