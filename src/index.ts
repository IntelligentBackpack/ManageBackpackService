import * as deviceModule from './models/RaspDeviceModule'
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const hubIot = new deviceModule.RaspDeviceConsumer();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  //  #swagger.tags = ['Root']
  //  #swagger.description = 'Web service root'
  /* 
      #swagger.responses[200] = {
        description: 'Return the root page of the web service' 
      }
  */
  res.send("Backpack service");
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
        description: 'Success operation' 
      }
      #swagger.responses[404] = {
        description: 'Device Id with that hash does not exists or email malformed' 
      }
      #swagger.responses[500] = {
        description: 'A problem occurred while registration' 
      }
  */
  try {
    var hash = req.params.hash;
    let data = req.body;
    var email = data["email"];
    var value = await hubIot.getDeviceConnectionString(hash);
    if(value == null || email == null || email == "") {
      res.status(404).send('Device Id with that hash does not exists or email malformed');
      return;
    }
    var dataToSend: string = "EMAIL:"+email;
    hubIot.sendMessage(value, dataToSend);
    hubIot.createEntryForFirebase(email, hash);
  } catch (e: any) {
    console.error(e);
    res.status(500).send('A problem occurred while registration: ' + e.message);
    return;
  }
  
  res.status(200).send('Device correctly registered');
})

const port = process.env.PORT || 80;
app.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
