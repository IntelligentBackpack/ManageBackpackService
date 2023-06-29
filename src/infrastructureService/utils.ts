import fs = require('fs');
import crypto = require('crypto');

export class Utils {

    static getLocalInfo(path: string) {
        const mydata = JSON.parse(fs.readFileSync(path).toString());
        return mydata;
    }

}

export const generateSasToken = function (resourceUri, signingKey, policyName, expiresInMins) {
    resourceUri = encodeURIComponent(resourceUri);

    // Set expiration in seconds
    let expires = (Date.now() / 1000) + expiresInMins * 60;
    expires = Math.ceil(expires);
    const toSign = resourceUri + '\n' + expires;

    // Use crypto
    const hmac = crypto.createHmac('sha256', Buffer.from(signingKey, 'base64'));
    hmac.update(toSign);
    const base64UriEncoded = encodeURIComponent(hmac.digest('base64'));

    // Construct authorization string
    let token = "SharedAccessSignature sr=" + resourceUri + "&sig="
        + base64UriEncoded + "&se=" + expires;
    if (policyName) token += "&skn=" + policyName;
    return token;
};