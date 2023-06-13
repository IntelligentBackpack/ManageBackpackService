const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/routes/ServiceRoutes.ts'];
const doc = {
  info: {
    title: 'Manage Backpack Service',
    description: 'This service permits users to register their own unregistered Intelligent Backpacks with their email.',
  },
  host: 'http://managebackpackservice.azurewebsites.net/',
  schemes: ['http'],
};

swaggerAutogen(outputFile, endpointsFiles, doc);