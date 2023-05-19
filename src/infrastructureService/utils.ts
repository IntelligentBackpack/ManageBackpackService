var fs = require('fs');

export class Utils {

    static getLocalInfo(path: string) {
        var mydata = JSON.parse(fs.readFileSync(path));
        return mydata;
    }

}