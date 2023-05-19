import { RegisteredDeviceImpl } from "../valueObjects/RegisteredDevice";
import { Repository } from '../repository/RepositoryInterface'
import { EmailPolicyImpl } from '../policies/EmailPolicy';
import {DevicePortInterface} from './DevicePort';

export class SendService {

    private sendConsumer: DevicePortInterface;
    private repository: Repository;

    constructor(consumer: DevicePortInterface, repository: Repository) {
        this.sendConsumer = consumer;
        this.repository = repository;
    }

    public async register(hash: string, email: string, success: ()=>void, error: ()=>void) {
        
        var device = await this.repository.getDeviceConnectionString(hash);

        if(device != null && EmailPolicyImpl.checkEmail(email)) {
            const myTimeout = setTimeout(() => {
                error();
            }, 5000);
            // il dispositivo esiste e non è registrato
            var callback = async () => {
                clearTimeout(myTimeout);
                    var result = await this.repository.registerDevice(hash, email, device.getDeviceId());
                    if(result != null) {
                        success();
                    }
                    else {
                        error();
                    }
            }
            this.sendConsumer.sendMessageConsumer(device.getDeviceId(), this.getRegistrationMessage(email), callback);
            return true;
        } else {
            return false;
        }
    }

    public sendUpdateNotification() {
        
    }

    private getRegistrationMessage(email: string) {
        return "EMAIL:" + email;
    }

    private getUpdateMessage() {
        return "UPDATE";
    }

}
