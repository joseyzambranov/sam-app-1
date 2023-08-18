// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
const AWS = require('aws-sdk');
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
//const sqs = new AWS.SQS();
const sqs = new AWS.SQS({// We can store these credentials in lambda environment variables
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    apiVersion: process.env.AWS_SQS_API_VERSION,
    region: process.env.REGION
});

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
exports.putItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const id = body.id;
    const name = body.name;

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName : tableName,
        Item: { id : id, name: name }
    };

    const result = await docClient.put(params).promise();
    const sqsParams = {
        MessageBody: JSON.stringify({ id, name }), // Puedes ajustar el contenido del mensaje
        QueueUrl: 'https://sqs.us-east-1.amazonaws.com/912844262341/sam-app-1-SimpleQueue-sEDKEBgJWsoW' // Reemplaza con la URL real de tu cola SQS
    };

    try {
        await sqs.sendMessage(sqsParams).promise();
        console.log('Mensaje enviado a la cola SQS');
    } catch (error) {
        console.error('Error al enviar mensaje a la cola SQS:', error);
    }



    const response = {
        statusCode: 200,
        body: JSON.stringify(body)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
