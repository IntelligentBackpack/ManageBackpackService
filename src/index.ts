import * as deviceModule from './models/RaspDeviceModule'
import { EmailPolicyImpl } from './domainModel/policies/EmailPolicy'
import { SendService } from './domainModel/domainService/SendMessagesService'
import {AzureHubUtilities} from './infrastructureService/azureHubIotService'
import {Utils} from './infrastructureService/utils'
import {RepositoryImpl} from './repository/RepositoryImpl'
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const crypto = require('crypto');
import axios from 'axios';

const localInfo = Utils.getLocalInfo("./build/properties.json");
const hubIotService = new AzureHubUtilities(localInfo["hub"]);
const repository = new RepositoryImpl(localInfo["user"], localInfo["pass"], "https://intelligentbackpack-d463a-default-rtdb.europe-west1.firebasedatabase.app");
const service = new SendService(hubIotService, repository);

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

var generateSasToken = function(resourceUri, signingKey, policyName, expiresInMins) {
  resourceUri = encodeURIComponent(resourceUri);

  // Set expiration in seconds
  var expires = (Date.now() / 1000) + expiresInMins * 60;
  expires = Math.ceil(expires);
  var toSign = resourceUri + '\n' + expires;

  // Use crypto
  var hmac = crypto.createHmac('sha256', Buffer.from(signingKey, 'base64'));
  hmac.update(toSign);
  var base64UriEncoded = encodeURIComponent(hmac.digest('base64'));

  // Construct authorization string
  var token = "SharedAccessSignature sr=" + resourceUri + "&sig="
  + base64UriEncoded + "&se=" + expires;
  if (policyName) token += "&skn="+policyName;
  return token;
};

app.get('/', async (req, res) => {
  //  #swagger.tags = ['Root']
  //  #swagger.description = 'Web service root'
  /* 
      #swagger.responses[200] = {
        description: 'Return the root page of the web service' 
      }
  */
    res.send("Backpack service");
})

app.get('/getAllDevices', async (req, res) => {
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
  
  var token: string = generateSasToken(endpoint, "kkEXnnmh9gfASfrgeav6MG3O8Wi85j+vngraAQvz904", "iothubowner", 60);

  await axios.get('https://IntelligentBackpackHub.azure-devices.net/devices?api-version=2020-05-31-preview',
  { headers: {
    'Authorization': `${token}`
  } })
  .then((response) => {
      console.log(response);
      res.send(response.data);           
  }, (error) => {
      console.log(error);
      res.status(500).send(error);
  });
})

app.put('/addDevice/:nameDevice', async (req, res) => {
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
  {"deviceId": deviceName},
  { headers: {
    'Authorization': `${token}`
  } })
  .then((response) => {
      console.log(response);
      res.send(response.data);           
  }, (error) => {
      console.log(error);
      res.status(500).send(error);
  });
})

app.delete('/:email/:backpackid', async (req, res) => {
  
})

app.post('/register/:hash', async (req, res) => {
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
    if(email == null || email == "" || !EmailPolicyImpl.checkEmail(email)) {
      res.status(502).send('Email malformed');
      return;
    }

    var result = await service.register(hash, email, 
      () => {
        if(!res.headersSent) {
          res.status(200).send('Device correctly registered');
        }
      }, 
      () => {
        if(!res.headersSent) {
          res.status(404).send('Device not found or not reachable');
        }
      });

    if(!result) {
      res.status(500).send('Device already registered or email malformed');
    }
    
  } catch (e: any) {
    console.error(e);
    res.status(500).send('A problem occurred while registration: ' + e.message);
    return;
  }
  
})

const port = process.env.PORT || 80;
app.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
