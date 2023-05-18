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
        
        //effettuare il timeout e relativo await finale, o clean in caso di successo
        //associare la callback di invio messaggio e di successo
        //success => res.send(200)
        //error => res.send(500)
        
        var device = await this.repository.getDeviceConnectionString(hash);
        if(device != null) {
            // il dispositivo esiste e non è registrato
            var callback = async () => {
                if(EmailPolicyImpl.checkEmail(email)) {
                    var result = await this.repository.registerDevice(hash, email);
                    if(result != null) {
                        success();
                    }
                    else {
                        error();
                    }
                } else {
                    error();
                }
            }
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
