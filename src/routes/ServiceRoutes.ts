import { Router } from 'express';
import { EmailPolicyImpl } from '../domainModel/policies/EmailPolicy'
import {generateSasToken} from '../infrastructureService/utils'
import {ServiceLocator} from '../infrastructureService/serviceLocator'
import axios from 'axios';

const router = Router();
export default router;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
router.get('/', async (req, res) => {
    //  #swagger.tags = ['Root']
    //  #swagger.description = 'Web service root'
    /* 
        #swagger.responses[200] = {
          description: 'Return the root page of the web service' 
        }
    */
    res.send("Backpack service");
})

router.get('/getAllDevices', async (req, res) => {
    //  #swagger.tags = ['Get all devices']
    //  #swagger.description = 'Get all existent devices from Azure Hub IoT'
    /* 
        #swagger.responses[200] = {
          description: 'List of devices' 
        }
        #swagger.responses[500] = {
          description: 'A problem occurred while getting devices information' 
        }
    */
    var endpoint = "IntelligentBackpackHub.azure-devices.net";

    var token: string = generateSasToken(endpoint, ServiceLocator.localInfo["policyKey"], "iothubowner", 60);

    await axios.get('https://IntelligentBackpackHub.azure-devices.net/devices?api-version=2020-05-31-preview',
        {
            headers: {
                'Authorization': `${token}`
            }
        })
        .then((response) => {
            console.log(response);
            res.send(response.data);
        }, (error) => {
            console.log(error);
            res.status(500).send(error);
        });
})

router.put('/addDevice/:nameDevice', async (req, res) => {
    //  #swagger.tags = ['addDevice']
    //  #swagger.description = 'Create a new device into Azure Hub IoT platform'
    /* 
        #swagger.parameters['nameDevice'] = {
                in: 'path',
                description: 'Name of the new device to create',
                required: true
        }
 
        #swagger.responses[200] = {
          description: 'Device correctly created with information' 
        }
        #swagger.responses[500] = {
          description: 'A problem occurred while creating the new device' 
        }
    */

    var endpoint = "IntelligentBackpackHub.azure-devices.net";

    var token: string = generateSasToken(endpoint, "kkEXnnmh9gfASfrgeav6MG3O8Wi85j+vngraAQvz904", "iothubowner", 60);
    var deviceName = req.params.nameDevice;
    await axios.put('https://IntelligentBackpackHub.azure-devices.net/devices/' + deviceName + '?api-version=2020-05-31-preview',
        { "deviceId": deviceName },
        {
            headers: {
                'Authorization': `${token}`
            }
        })
        .then((response) => {
            console.log(response);
            res.send(response.data);
        }, (error) => {
            console.log(error);
            res.status(500).send(error);
        });

    ServiceLocator.service.addDevice(deviceName);
    
})

router.delete('/unregister/:hash', async (req, res) => {
    //  #swagger.tags = ['Unregister']
    //  #swagger.description = 'Unregister the device owned by the specified user email'
    /* 
        #swagger.parameters['hash'] = {
                in: 'path',
                description: 'Hashed device id to be unregistered',
                required: true
        }
  
        #swagger.parameters['email'] = {
          in: 'body',
          description: 'User email that own the device to unregister',
          required: true,
          type: 'json',
          schema: {
              $email: 'prova@example.it'
          }
        }
  
        #swagger.responses[200] = {
          description: 'Device correctly unregistered' 
        }
        #swagger.responses[404] = {
          description: 'Device not found or not reachable' 
        }
        #swagger.responses[500] = {
          description: 'Device not registered or email malformed' 
        }
        #swagger.responses[500] = {
          description: 'A problem occurred while registration' 
        }
        #swagger.responses[502] = {
          description: 'Email malformed' 
        }
    */
    try {
        var hash = req.params.hash;
        let data = req.body;
        var email = data["email"];
        if (email == null || email == "" || !EmailPolicyImpl.checkEmail(email)) {
            res.status(502).send('Email malformed');
            return;
        }

        var result = await ServiceLocator.service.unRegister(hash, email,
            () => {
                if (!res.headersSent) {
                    res.status(200).send('Device correctly unregistered');
                }
            },
            () => {
                if (!res.headersSent) {
                    res.status(404).send('Device not found or not reachable');
                }
            });

        if (!result) {
            res.status(500).send('Device not registered or email malformed');
        }

    } catch (e: any) {
        console.error(e);
        res.status(500).send('A problem occurred while registration: ' + e.message);
        return;
    }
})

router.post('/register/:hash', async (req, res) => {
    //  #swagger.tags = ['Register']
    //  #swagger.description = 'Register the device with a user email'
    /* 
        #swagger.parameters['hash'] = {
                in: 'path',
                description: 'Hashed device id to be registered',
                required: true
        }
  
        #swagger.parameters['email'] = {
          in: 'body',
          description: 'User email to register for the specified device',
          required: true,
          type: 'json',
          schema: {
              $email: 'prova@example.it'
          }
        }
  
        #swagger.responses[200] = {
          description: 'Device correctly registered' 
        }
        #swagger.responses[404] = {
          description: 'Device not found or not reachable' 
        }
        #swagger.responses[500] = {
          description: 'Device already registered or email malformed' 
        }
        #swagger.responses[500] = {
          description: 'A problem occurred while registration' 
        }
        #swagger.responses[502] = {
          description: 'Email malformed' 
        }
    */
    try {
        var hash = req.params.hash;
        let data = req.body;
        var email = data["email"];
        if (email == null || email == "" || !EmailPolicyImpl.checkEmail(email)) {
            res.status(502).send('Email malformed');
            return;
        }

        var result = await ServiceLocator.service.register(hash, email,
            () => {
                if (!res.headersSent) {
                    res.status(200).send('Device correctly registered');
                }
            },
            () => {
                if (!res.headersSent) {
                    res.status(404).send('Device not found or not reachable');
                }
            });

        if (!result) {
            res.status(500).send('Device already registered or email malformed');
        }

    } catch (e: any) {
        console.error(e);
        res.status(500).send('A problem occurred while registration: ' + e.message);
        return;
    }

})