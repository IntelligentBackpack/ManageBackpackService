import { SendService } from '../domainModel/domainService/SendMessagesService'
import {AzureHubUtilities} from '../infrastructureService/azureHubIotService'
import {Utils} from '../infrastructureService/utils'
import {RepositoryImpl} from '../repository/RepositoryImpl'

export class ServiceLocator {
    static localInfo = Utils.getLocalInfo("./build/properties.json");
    static hubIotService = new AzureHubUtilities(this.localInfo["hub"]);
    static repository = new RepositoryImpl(this.localInfo["user"], this.localInfo["pass"], "https://intelligentbackpack-d463a-default-rtdb.europe-west1.firebasedatabase.app");
    static service = new SendService(this.hubIotService, this.repository);
}
