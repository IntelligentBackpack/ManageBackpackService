
export class RegisteredDeviceImpl {

    private deviceId = "";
    private hash = "";
    private email = "";

    constructor(hash: string, deviceId: string, email: string) {
        this.deviceId = deviceId;
        this.hash = hash;
        this.email = email;
    }

    public getDeviceId() {
        return this.deviceId;
    }

    public getHash() {
        return this.hash;
    }

    public getEmail() {
        return this.email;
    }

}