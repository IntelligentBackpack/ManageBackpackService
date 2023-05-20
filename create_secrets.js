/*
    Used inside GitHub Actions workflow to retrieve secrets
    and save them into the Azure App Service deploy
*/
var user = process.env.USER_DB;
var password = process.env.PASSWORD_DB;
var iotHubConn = process.env.HUB_IOT_CONN;
var policyKey = process.env.AZURE_POLICY_KEY;

console.log('{ "user": "' + user + '", "pass": "' + password + '", "hub": "' + iotHubConn + '", "policyKey": "' + policyKey + '" }');
